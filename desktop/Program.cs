using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Runtime.InteropServices;
using System.Text;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace ComputerEvolutionLab;

internal static class Program
{
    internal const string AppUserModelId = "Cosmogonic.ComputerEvolutionLab";
    internal const string CanonicalRepoRoot = @"Z:\[Vibe Coded (AI)]\CLAUDECODE\Computer Evolution Lab";

    [DllImport("shell32.dll", SetLastError = true)]
    private static extern int SetCurrentProcessExplicitAppUserModelID([MarshalAs(UnmanagedType.LPWStr)] string appID);

    [STAThread]
    private static int Main(string[] args)
    {
        try
        {
            SetCurrentProcessExplicitAppUserModelID(AppUserModelId);
        }
        catch
        {
            // Non-fatal on older shells
        }

        string? labRoot = ResolveLabRoot();
        if (labRoot is null)
        {
            MessageBox.Show(
                "Could not locate Computer Evolution Lab assets (index.html).\n\nExpected at:\n" + CanonicalRepoRoot,
                "Computer Evolution Lab",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error
            );
            return 2;
        }

        if (args.Contains("--install-shortcuts", StringComparer.OrdinalIgnoreCase))
        {
            return ShortcutInstaller.InstallStartMenuShortcut(labRoot);
        }

        using var server = new LoopbackLabServer(labRoot);
        server.Start();

        if (args.Contains("--smoke-test", StringComparer.OrdinalIgnoreCase))
        {
            return RunSmokeTest(server.BaseUrl, labRoot);
        }

        ApplicationConfiguration.Initialize();
        using var mainForm = new LabWindow(server.BaseUrl, labRoot);
        Application.Run(mainForm);
        return 0;
    }

    private static int RunSmokeTest(string baseUrl, string labRoot)
    {
        try
        {
            using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(5) };
            string html = http.GetStringAsync(baseUrl + "/index.html").GetAwaiter().GetResult();
            if (!html.Contains("Computer Evolution Lab", StringComparison.Ordinal))
            {
                Console.Error.WriteLine("SMOKE_FAIL: index.html content mismatch");
                return 3;
            }
            string js = http.GetStringAsync(baseUrl + "/src/app/lab-main.js").GetAwaiter().GetResult();
            if (js.Length < 1000)
            {
                Console.Error.WriteLine("SMOKE_FAIL: lab-main.js too short");
                return 4;
            }
            string? wvVer = null;
            try
            {
                wvVer = CoreWebView2Environment.GetAvailableBrowserVersionString();
            }
            catch
            {
                wvVer = null;
            }
            string reportPath = Path.Combine(Path.GetTempPath(), "cel-exe-smoke.txt");
            File.WriteAllText(
                reportPath,
                $"SMOKE_OK\nUrl={baseUrl}\nRoot={labRoot}\nWebView2={wvVer ?? "fallback"}\n",
                Encoding.UTF8
            );
            return 0;
        }
        catch (Exception ex)
        {
            string reportPath = Path.Combine(Path.GetTempPath(), "cel-exe-smoke.txt");
            File.WriteAllText(reportPath, "SMOKE_ERR: " + ex, Encoding.UTF8);
            return 5;
        }
    }

    internal static string? ResolveLabRoot()
    {
        var candidates = new List<string>();

        string? envRoot = Environment.GetEnvironmentVariable("CEL_ROOT");
        if (!string.IsNullOrWhiteSpace(envRoot))
        {
            candidates.Add(envRoot);
        }

        string? exePath = Environment.ProcessPath;
        if (!string.IsNullOrEmpty(exePath))
        {
            string? exeDir = Path.GetDirectoryName(exePath);
            if (!string.IsNullOrEmpty(exeDir))
            {
                candidates.Add(exeDir);
                candidates.Add(Path.GetFullPath(Path.Combine(exeDir, "..")));
                candidates.Add(Path.GetFullPath(Path.Combine(exeDir, "..", "..", "..", "..")));
            }
        }

        candidates.Add(AppContext.BaseDirectory);
        candidates.Add(CanonicalRepoRoot);

        foreach (string dir in candidates)
        {
            try
            {
                if (
                    Directory.Exists(dir)
                    && File.Exists(Path.Combine(dir, "index.html"))
                    && File.Exists(Path.Combine(dir, "src", "app", "lab-main.js"))
                )
                {
                    return Path.GetFullPath(dir);
                }
            }
            catch
            {
                // Ignore invalid candidate paths
            }
        }
        return null;
    }
}

internal sealed class LabWindow : Form
{
    private const int DWMWA_USE_IMMERSIVE_DARK_MODE = 20;
    private const int DWMWA_CAPTION_COLOR = 35;

    [DllImport("dwmapi.dll")]
    private static extern int DwmSetWindowAttribute(IntPtr hwnd, int attr, ref int attrValue, int attrSize);

    private readonly string _baseUrl;
    private readonly string _labRoot;
    private readonly WebView2 _webView;
    private bool _isFullscreen;
    private FormWindowState _prevState;
    private FormBorderStyle _prevBorder;
    private Rectangle _prevBounds;

    public LabWindow(string baseUrl, string labRoot)
    {
        _baseUrl = baseUrl;
        _labRoot = labRoot;

        Text = "Computer Evolution Lab — Interactive 4K 3D Architecture & Computing Museum";
        BackColor = Color.FromArgb(7, 11, 16);
        ForeColor = Color.FromArgb(230, 237, 243);
        KeyPreview = true;

        Rectangle work = Screen.FromPoint(Cursor.Position).WorkingArea;
        int w = Math.Min(Math.Max(1360, (int)(work.Width * 0.90)), work.Width);
        int h = Math.Min(Math.Max(820, (int)(work.Height * 0.90)), work.Height);
        StartPosition = FormStartPosition.CenterScreen;
        Size = new Size(w, h);
        MinimumSize = new Size(960, 620);

        if (work.Width <= 1920)
        {
            WindowState = FormWindowState.Maximized;
        }

        TryLoadWindowIcon();

        _webView = new WebView2
        {
            Dock = DockStyle.Fill,
            DefaultBackgroundColor = Color.FromArgb(255, 7, 11, 16),
        };
        Controls.Add(_webView);

        HandleCreated += (_, _) => ApplyDarkTitleBar();
        KeyDown += OnFormKeyDown;
        Shown += async (_, _) => await InitializeAsync();
    }

    private void TryLoadWindowIcon()
    {
        try
        {
            string icoPath = Path.Combine(_labRoot, "assets", "icon", "computer-evolution-lab.ico");
            if (File.Exists(icoPath))
            {
                Icon = new Icon(icoPath);
                return;
            }
            if (!string.IsNullOrEmpty(Environment.ProcessPath))
            {
                Icon = Icon.ExtractAssociatedIcon(Environment.ProcessPath);
            }
        }
        catch
        {
            // Keep default icon if extraction fails
        }
    }

    private void ApplyDarkTitleBar()
    {
        try
        {
            int dark = 1;
            DwmSetWindowAttribute(Handle, DWMWA_USE_IMMERSIVE_DARK_MODE, ref dark, sizeof(int));
            // COLORREF is 0x00BBGGRR -> #070B10 => R=0x07, G=0x0B, B=0x10 => 0x00100B07
            int captionColor = 0x00100B07;
            DwmSetWindowAttribute(Handle, DWMWA_CAPTION_COLOR, ref captionColor, sizeof(int));
        }
        catch
        {
            // Supported on Windows 10 20H1+ / Windows 11
        }
    }

    private void OnFormKeyDown(object? sender, KeyEventArgs e)
    {
        if (e.KeyCode == Keys.F11 || (e.Alt && e.KeyCode == Keys.Enter))
        {
            ToggleFullscreen();
            e.Handled = true;
        }
    }

    private void ToggleFullscreen()
    {
        if (!_isFullscreen)
        {
            _prevState = WindowState;
            _prevBorder = FormBorderStyle;
            _prevBounds = Bounds;
            WindowState = FormWindowState.Normal;
            FormBorderStyle = FormBorderStyle.None;
            Bounds = Screen.FromControl(this).Bounds;
            _isFullscreen = true;
        }
        else
        {
            FormBorderStyle = _prevBorder;
            Bounds = _prevBounds;
            WindowState = _prevState;
            _isFullscreen = false;
        }
    }

    private async Task InitializeAsync()
    {
        try
        {
            string userDataDir = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "ComputerEvolutionLab",
                "WebView2"
            );
            Directory.CreateDirectory(userDataDir);

            var envOptions = new CoreWebView2EnvironmentOptions(
                "--autoplay-policy=no-user-gesture-required --enable-gpu-rasterization --ignore-gpu-blocklist"
            );
            var env = await CoreWebView2Environment.CreateAsync(null, userDataDir, envOptions);
            await _webView.EnsureCoreWebView2Async(env);

            var settings = _webView.CoreWebView2.Settings;
            settings.AreDefaultContextMenusEnabled = true;
            settings.AreDevToolsEnabled = true;
            settings.IsStatusBarEnabled = false;
            settings.IsZoomControlEnabled = false;

            _webView.KeyDown += (_, e) =>
            {
                if (e.KeyCode == Keys.F11 || (e.Alt && e.KeyCode == Keys.Enter))
                {
                    ToggleFullscreen();
                    e.Handled = true;
                }
            };

            _webView.CoreWebView2.DocumentTitleChanged += (_, _) =>
            {
                string t = _webView.CoreWebView2.DocumentTitle;
                if (!string.IsNullOrWhiteSpace(t))
                {
                    Text = t;
                }
            };

            _webView.CoreWebView2.Navigate(_baseUrl + "/index.html");
        }
        catch
        {
            LaunchBrowserAppFallback(_baseUrl + "/index.html");
            Close();
        }
    }

    private static void LaunchBrowserAppFallback(string url)
    {
        string[] browsers =
        [
            Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86),
                "Microsoft",
                "Edge",
                "Application",
                "msedge.exe"
            ),
            Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles),
                "Google",
                "Chrome",
                "Application",
                "chrome.exe"
            ),
        ];

        foreach (string browser in browsers)
        {
            if (File.Exists(browser))
            {
                Process.Start(
                    new ProcessStartInfo
                    {
                        FileName = browser,
                        Arguments = $"--app=\"{url}\" --start-maximized",
                        UseShellExecute = false,
                    }
                );
                return;
            }
        }

        Process.Start(new ProcessStartInfo { FileName = url, UseShellExecute = true });
    }
}

internal sealed class LoopbackLabServer : IDisposable
{
    private static readonly Dictionary<string, string> MimeTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        [".html"] = "text/html; charset=utf-8",
        [".css"] = "text/css; charset=utf-8",
        [".js"] = "text/javascript; charset=utf-8",
        [".mjs"] = "text/javascript; charset=utf-8",
        [".json"] = "application/json; charset=utf-8",
        [".svg"] = "image/svg+xml",
        [".png"] = "image/png",
        [".jpg"] = "image/jpeg",
        [".jpeg"] = "image/jpeg",
        [".ico"] = "image/x-icon",
        [".woff2"] = "font/woff2",
        [".wasm"] = "application/wasm",
        [".md"] = "text/markdown; charset=utf-8",
    };

    private readonly string _rootDir;
    private readonly TcpListener _listener;
    private readonly CancellationTokenSource _cts = new();

    public string BaseUrl { get; private set; } = "";

    public LoopbackLabServer(string rootDir)
    {
        _rootDir = Path.GetFullPath(rootDir);
        _listener = new TcpListener(IPAddress.Loopback, 0);
    }

    public void Start()
    {
        _listener.Start();
        int port = ((IPEndPoint)_listener.LocalEndpoint).Port;
        BaseUrl = $"http://127.0.0.1:{port}";
        _ = AcceptLoopAsync(_cts.Token);
    }

    private async Task AcceptLoopAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            try
            {
                TcpClient client = await _listener.AcceptTcpClientAsync(ct);
                _ = HandleClientAsync(client, ct);
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch
            {
                // Ignore transient socket errors
            }
        }
    }

    private async Task HandleClientAsync(TcpClient client, CancellationToken ct)
    {
        using (client)
        {
            try
            {
                client.NoDelay = true;
                using NetworkStream stream = client.GetStream();
                using var reader = new StreamReader(stream, Encoding.ASCII, leaveOpen: true);

                string? requestLine = await reader.ReadLineAsync(ct);
                if (string.IsNullOrEmpty(requestLine))
                {
                    return;
                }

                // Drain request headers
                string? headerLine;
                while (!string.IsNullOrEmpty(headerLine = await reader.ReadLineAsync(ct))) { }

                string[] parts = requestLine.Split(' ');
                if (parts.Length < 2)
                {
                    return;
                }

                string method = parts[0].ToUpperInvariant();
                string rawTarget = parts[1];
                int qIdx = rawTarget.IndexOf('?');
                string urlPath = Uri.UnescapeDataString(qIdx >= 0 ? rawTarget[..qIdx] : rawTarget);
                if (urlPath == "/" || string.IsNullOrEmpty(urlPath))
                {
                    urlPath = "/index.html";
                }

                string relPath = urlPath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
                string fullPath = Path.GetFullPath(Path.Combine(_rootDir, relPath));

                if (!fullPath.StartsWith(_rootDir, StringComparison.OrdinalIgnoreCase) || !File.Exists(fullPath))
                {
                    await WriteResponseAsync(
                        stream,
                        "404 Not Found",
                        "text/plain; charset=utf-8",
                        Encoding.UTF8.GetBytes("Not Found"),
                        method == "HEAD",
                        ct
                    );
                    return;
                }

                string ext = Path.GetExtension(fullPath);
                string mime = MimeTypes.TryGetValue(ext, out string? found) ? found : "application/octet-stream";
                byte[] body = await File.ReadAllBytesAsync(fullPath, ct);

                await WriteResponseAsync(stream, "200 OK", mime, body, method == "HEAD", ct);
            }
            catch
            {
                // Client disconnected
            }
        }
    }

    private static async Task WriteResponseAsync(
        NetworkStream stream,
        string status,
        string contentType,
        byte[] body,
        bool headOnly,
        CancellationToken ct
    )
    {
        string headers =
            $"HTTP/1.1 {status}\r\n"
            + $"Content-Type: {contentType}\r\n"
            + $"Content-Length: {body.Length}\r\n"
            + "Cache-Control: no-cache\r\n"
            + "Connection: close\r\n\r\n";

        byte[] headerBytes = Encoding.ASCII.GetBytes(headers);
        await stream.WriteAsync(headerBytes, ct);
        if (!headOnly && body.Length > 0)
        {
            await stream.WriteAsync(body, ct);
        }
        await stream.FlushAsync(ct);
    }

    public void Dispose()
    {
        _cts.Cancel();
        try
        {
            _listener.Stop();
        }
        catch { }
        _cts.Dispose();
    }
}

internal static class ShortcutInstaller
{
    [ComImport]
    [Guid("00021401-0000-0000-C000-000000000046")]
    private class ShellLink { }

    [ComImport]
    [InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    [Guid("000214F9-0000-0000-C000-000000000046")]
    private interface IShellLinkW
    {
        void GetPath([Out, MarshalAs(UnmanagedType.LPWStr)] StringBuilder pszFile, int cchMaxPath, IntPtr pfd, int fFlags);
        void GetIDList(out IntPtr ppidl);
        void SetIDList(IntPtr pidl);
        void GetDescription([Out, MarshalAs(UnmanagedType.LPWStr)] StringBuilder pszName, int cchMaxName);
        void SetDescription([MarshalAs(UnmanagedType.LPWStr)] string pszName);
        void GetWorkingDirectory([Out, MarshalAs(UnmanagedType.LPWStr)] StringBuilder pszDir, int cchMaxPath);
        void SetWorkingDirectory([MarshalAs(UnmanagedType.LPWStr)] string pszDir);
        void GetArguments([Out, MarshalAs(UnmanagedType.LPWStr)] StringBuilder pszArgs, int cchMaxPath);
        void SetArguments([MarshalAs(UnmanagedType.LPWStr)] string pszArgs);
        void GetHotkey(out short pwHotkey);
        void SetHotkey(short wHotkey);
        void GetShowCmd(out int piShowCmd);
        void SetShowCmd(int iShowCmd);
        void GetIconLocation([Out, MarshalAs(UnmanagedType.LPWStr)] StringBuilder pszIconPath, int cchIconPath, out int piIcon);
        void SetIconLocation([MarshalAs(UnmanagedType.LPWStr)] string pszIconPath, int iIcon);
        void SetRelativePath([MarshalAs(UnmanagedType.LPWStr)] string pszPathRel, int dwReserved);
        void Resolve(IntPtr hwnd, int fFlags);
        void SetPath([MarshalAs(UnmanagedType.LPWStr)] string pszFile);
    }

    [ComImport]
    [InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    [Guid("0000010b-0000-0000-C000-000000000046")]
    private interface IPersistFile
    {
        void GetClassID(out Guid pClassID);
        [PreserveSig]
        int IsDirty();
        void Load([MarshalAs(UnmanagedType.LPWStr)] string pszFileName, uint dwMode);
        void Save([MarshalAs(UnmanagedType.LPWStr)] string pszFileName, [MarshalAs(UnmanagedType.Bool)] bool fRemember);
        void SaveCompleted([MarshalAs(UnmanagedType.LPWStr)] string pszFileName);
        void GetCurFile([MarshalAs(UnmanagedType.LPWStr)] out string ppszFileName);
    }

    [ComImport]
    [InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    [Guid("886D8EEB-8CF2-4446-8D02-CDBA1DBDCF99")]
    private interface IPropertyStore
    {
        void GetCount(out uint cProps);
        void GetAt(uint iProp, out PROPERTYKEY pkey);
        void GetValue(ref PROPERTYKEY key, out PROPVARIANT pv);
        void SetValue(ref PROPERTYKEY key, ref PROPVARIANT pv);
        void Commit();
    }

    [StructLayout(LayoutKind.Sequential, Pack = 4)]
    private struct PROPERTYKEY
    {
        public Guid fmtid;
        public uint pid;
    }

    [StructLayout(LayoutKind.Explicit)]
    private struct PROPVARIANT
    {
        [FieldOffset(0)]
        public ushort vt;

        [FieldOffset(8)]
        public IntPtr pszVal;
    }

    [DllImport("ole32.dll")]
    private static extern int PropVariantClear(ref PROPVARIANT pvar);

    public static int InstallStartMenuShortcut(string labRoot)
    {
        try
        {
            string exePath =
                Environment.ProcessPath
                ?? Path.Combine(labRoot, "Computer Evolution Lab.exe");
            string icoPath = Path.Combine(labRoot, "assets", "icon", "computer-evolution-lab.ico");
            string programsDir = Environment.GetFolderPath(Environment.SpecialFolder.Programs);
            Directory.CreateDirectory(programsDir);
            string lnkPath = Path.Combine(programsDir, "Computer Evolution Lab.lnk");

            CreateShortcutWithAppId(
                lnkPath,
                exePath,
                labRoot,
                "Computer Evolution Lab — Interactive 4K 3D Architecture & Computing Museum (17 Operational Computers)",
                File.Exists(icoPath) ? icoPath : exePath,
                Program.AppUserModelId
            );
            return 0;
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine("Shortcut error: " + ex.Message);
            return 1;
        }
    }

    private static void CreateShortcutWithAppId(
        string lnkPath,
        string targetExe,
        string workingDir,
        string description,
        string iconPath,
        string appUserModelId
    )
    {
        var link = (IShellLinkW)new ShellLink();
        link.SetPath(targetExe);
        link.SetWorkingDirectory(workingDir);
        link.SetDescription(description);
        link.SetIconLocation(iconPath, 0);

        var propStore = (IPropertyStore)link;
        var pkeyAppId = new PROPERTYKEY
        {
            fmtid = new Guid("9F4C2855-9F79-4B39-A8D0-E1D42DE1D5F3"),
            pid = 5,
        };
        var pv = new PROPVARIANT
        {
            vt = 31, // VT_LPWSTR
            pszVal = Marshal.StringToCoTaskMemUni(appUserModelId),
        };
        try
        {
            propStore.SetValue(ref pkeyAppId, ref pv);
            propStore.Commit();
        }
        finally
        {
            PropVariantClear(ref pv);
        }

        var persist = (IPersistFile)link;
        persist.Save(lnkPath, true);
    }
}
