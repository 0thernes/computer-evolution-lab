using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.IO.Compression;
using System.Net;
using System.Net.Sockets;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Text;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace ComputerEvolutionLab;

internal static class Program
{
    internal const string AppUserModelId = "Cosmogonic.ComputerEvolutionLab";

    [DllImport("shell32.dll", SetLastError = true)]
    private static extern int SetCurrentProcessExplicitAppUserModelID(
        [MarshalAs(UnmanagedType.LPWStr)] string appID
    );

    [STAThread]
    private static int Main(string[] args)
    {
        try
        {
            SetCurrentProcessExplicitAppUserModelID(AppUserModelId);
        }
        catch
        {
            // Non-fatal on older Windows shells
        }

        string? labRoot = ResolveLabRoot();
        var embedded = EmbeddedAssetStore.Load();

        if (labRoot is null && embedded.Count == 0)
        {
            MessageBox.Show(
                "Could not locate Computer Evolution Lab assets (index.html) on disk or in embedded bundle.",
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

        CleanupStaleInstanceProfiles();

        using var server = new LoopbackLabServer(labRoot, embedded);
        server.Start();

        if (args.Contains("--smoke-test", StringComparer.OrdinalIgnoreCase))
        {
            return RunSmokeTest(server.BaseUrl, labRoot, embedded.Count);
        }

        string? verifyReport = null;
        string? verifyPng = null;
        int verifyIdx = Array.FindIndex(
            args,
            a => string.Equals(a, "--verify-ui", StringComparison.OrdinalIgnoreCase)
        );
        if (verifyIdx >= 0)
        {
            verifyReport =
                verifyIdx + 1 < args.Length
                    ? args[verifyIdx + 1]
                    : Path.Combine(Path.GetTempPath(), "cel-ui-verify.txt");
            verifyPng =
                verifyIdx + 2 < args.Length
                    ? args[verifyIdx + 2]
                    : Path.Combine(Path.GetTempPath(), "cel-ui-verify.png");
        }

        ApplicationConfiguration.Initialize();
        using var mainForm = new LabWindow(
            server.BaseUrl,
            labRoot,
            embedded,
            verifyReport,
            verifyPng
        );
        Application.Run(mainForm);
        return mainForm.VerifyExitCode;
    }

    private static void CleanupStaleInstanceProfiles()
    {
        try
        {
            string instancesDir = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "ComputerEvolutionLab",
                "Instances"
            );
            if (!Directory.Exists(instancesDir))
            {
                return;
            }
            foreach (string dir in Directory.GetDirectories(instancesDir, "pid-*"))
            {
                string leaf = Path.GetFileName(dir);
                if (
                    leaf.StartsWith("pid-", StringComparison.OrdinalIgnoreCase)
                    && int.TryParse(leaf.AsSpan(4), out int pid)
                    && pid != Environment.ProcessId
                )
                {
                    bool alive = false;
                    try
                    {
                        using var p = Process.GetProcessById(pid);
                        alive = !p.HasExited;
                    }
                    catch
                    {
                        alive = false;
                    }
                    if (!alive)
                    {
                        try
                        {
                            Directory.Delete(dir, recursive: true);
                        }
                        catch { }
                    }
                }
            }
        }
        catch { }
    }

    private static int RunSmokeTest(string baseUrl, string? labRoot, int embeddedCount)
    {
        string reportPath = Path.Combine(Path.GetTempPath(), "cel-exe-smoke.txt");
        try
        {
            using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(8) };
            string html = http.GetStringAsync(baseUrl + "/index.html").GetAwaiter().GetResult();
            if (!html.Contains("Computer Evolution Lab", StringComparison.Ordinal))
            {
                File.WriteAllText(reportPath, "SMOKE_FAIL: index.html content mismatch", Encoding.UTF8);
                return 3;
            }
            byte[] threeJs = http
                .GetByteArrayAsync(baseUrl + "/vendor/three-bundle.js")
                .GetAwaiter()
                .GetResult();
            if (threeJs.Length < 500_000)
            {
                File.WriteAllText(
                    reportPath,
                    $"SMOKE_FAIL: three-bundle.js truncated ({threeJs.Length} B)",
                    Encoding.UTF8
                );
                return 4;
            }
            string js = http
                .GetStringAsync(baseUrl + "/src/app/lab-main.js")
                .GetAwaiter()
                .GetResult();
            if (js.Length < 1000)
            {
                File.WriteAllText(reportPath, "SMOKE_FAIL: lab-main.js too short", Encoding.UTF8);
                return 5;
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
            File.WriteAllText(
                reportPath,
                $"SMOKE_OK\nUrl={baseUrl}\nRoot={labRoot ?? "(embedded-only)"}\nEmbeddedFiles={embeddedCount}\nThreeBytes={threeJs.Length}\nWebView2={wvVer ?? "fallback"}\n",
                Encoding.UTF8
            );
            return 0;
        }
        catch (Exception ex)
        {
            File.WriteAllText(reportPath, "SMOKE_ERR: " + ex, Encoding.UTF8);
            return 6;
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
        candidates.Add(Directory.GetCurrentDirectory());

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

internal static class EmbeddedAssetStore
{
    public static Dictionary<string, byte[]> Load()
    {
        var map = new Dictionary<string, byte[]>(StringComparer.OrdinalIgnoreCase);
        try
        {
            using Stream? res = Assembly
                .GetExecutingAssembly()
                .GetManifestResourceStream("lab-assets.zip");
            if (res is null)
            {
                return map;
            }
            using var zip = new ZipArchive(res, ZipArchiveMode.Read);
            foreach (ZipArchiveEntry entry in zip.Entries)
            {
                if (string.IsNullOrEmpty(entry.Name))
                {
                    continue;
                }
                string key = "/" + entry.FullName.Replace('\\', '/').TrimStart('/');
                using Stream es = entry.Open();
                using var ms = new MemoryStream((int)Math.Max(entry.Length, 0));
                es.CopyTo(ms);
                map[key] = ms.ToArray();
            }
        }
        catch
        {
            // Return whatever loaded
        }
        return map;
    }
}

internal sealed class LabWindow : Form
{
    private const int DWMWA_USE_IMMERSIVE_DARK_MODE = 20;
    private const int DWMWA_CAPTION_COLOR = 35;

    [DllImport("dwmapi.dll")]
    private static extern int DwmSetWindowAttribute(
        IntPtr hwnd,
        int attr,
        ref int attrValue,
        int attrSize
    );

    private readonly string _baseUrl;
    private readonly string? _labRoot;
    private readonly Dictionary<string, byte[]> _embedded;
    private readonly string? _verifyReport;
    private readonly string? _verifyPng;
    private readonly WebView2 _webView;
    private bool _isFullscreen;
    private FormWindowState _prevState;
    private FormBorderStyle _prevBorder;
    private Rectangle _prevBounds;

    public int VerifyExitCode { get; private set; }

    public LabWindow(
        string baseUrl,
        string? labRoot,
        Dictionary<string, byte[]> embedded,
        string? verifyReport,
        string? verifyPng
    )
    {
        _baseUrl = baseUrl;
        _labRoot = labRoot;
        _embedded = embedded;
        _verifyReport = verifyReport;
        _verifyPng = verifyPng;

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

        if (_verifyReport is null && work.Width <= 1920)
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
            if (_labRoot is not null)
            {
                string icoPath = Path.Combine(
                    _labRoot,
                    "assets",
                    "icon",
                    "computer-evolution-lab.ico"
                );
                if (File.Exists(icoPath))
                {
                    Icon = new Icon(icoPath);
                    return;
                }
            }
            if (_embedded.TryGetValue("/assets/icon/computer-evolution-lab.ico", out byte[]? icoBytes))
            {
                using var ms = new MemoryStream(icoBytes);
                Icon = new Icon(ms);
                return;
            }
            if (!string.IsNullOrEmpty(Environment.ProcessPath))
            {
                Icon = Icon.ExtractAssociatedIcon(Environment.ProcessPath);
            }
        }
        catch
        {
            // Keep default application icon if extraction fails
        }
    }

    private void ApplyDarkTitleBar()
    {
        try
        {
            int dark = 1;
            DwmSetWindowAttribute(Handle, DWMWA_USE_IMMERSIVE_DARK_MODE, ref dark, sizeof(int));
            int captionColor = 0x00100B07; // #070B10 in COLORREF (0x00BBGGRR)
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

    private async Task<bool> TryInitWebViewWithProfileAsync(string userDataDir)
    {
        Directory.CreateDirectory(userDataDir);
        var envOptions = new CoreWebView2EnvironmentOptions(
            "--autoplay-policy=no-user-gesture-required --enable-gpu-rasterization --ignore-gpu-blocklist"
        );
        var env = await CoreWebView2Environment.CreateAsync(null, userDataDir, envOptions);
        await _webView.EnsureCoreWebView2Async(env);
        return _webView.CoreWebView2 is not null;
    }

    private async Task InitializeAsync()
    {
        string baseAppData = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "ComputerEvolutionLab"
        );
        string primaryDir =
            _verifyReport is not null
                ? Path.Combine(baseAppData, "Instances", $"verify-{Environment.ProcessId}")
                : Path.Combine(baseAppData, "WebView2");
        string fallbackDir = Path.Combine(
            baseAppData,
            "Instances",
            $"pid-{Environment.ProcessId}"
        );

        Exception? lastErr = null;
        bool ready = false;

        foreach (string candidateDir in new[] { primaryDir, fallbackDir })
        {
            try
            {
                if (await TryInitWebViewWithProfileAsync(candidateDir))
                {
                    ready = true;
                    break;
                }
            }
            catch (Exception ex)
            {
                lastErr = ex;
            }
        }

        if (!ready || _webView.CoreWebView2 is null)
        {
            if (_verifyReport is not null)
            {
                File.WriteAllText(
                    _verifyReport,
                    "VERIFY_FAIL: WebView2 init failed: " + lastErr,
                    Encoding.UTF8
                );
                VerifyExitCode = 7;
                Close();
                return;
            }
            SwitchToBrowserHostFallback(_baseUrl + "/index.html");
            return;
        }

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

        if (_verifyReport is not null)
        {
            await RunEndToEndUiVerificationAsync(_verifyReport, _verifyPng);
        }
    }

    private async Task RunEndToEndUiVerificationAsync(string reportPath, string? pngPath)
    {
        try
        {
            var sw = Stopwatch.StartNew();
            string statusJson = "";
            bool booted = false;

            while (sw.ElapsedMilliseconds < 25000)
            {
                await Task.Delay(250);
                statusJson = await _webView.CoreWebView2.ExecuteScriptAsync(
                    "(() => ({ started: !!window.__labStarted, err: document.querySelector('#boot.err pre')?.textContent || '', machines: window.LAB ? window.LAB.machines.length : 0, webgl2: !!(window.LAB && window.LAB.renderer && window.LAB.renderer.capabilities.isWebGL2) }))()"
                );
                if (statusJson.Contains("\"started\":true", StringComparison.Ordinal))
                {
                    booted = true;
                    break;
                }
                if (
                    statusJson.Contains("\"err\":\"", StringComparison.Ordinal)
                    && !statusJson.Contains("\"err\":\"\"", StringComparison.Ordinal)
                )
                {
                    break;
                }
            }

            if (!booted)
            {
                File.WriteAllText(
                    reportPath,
                    $"VERIFY_FAIL: Did not boot within 25s. Last={statusJson}",
                    Encoding.UTF8
                );
                VerifyExitCode = 8;
                Close();
                return;
            }

            string pc20Check = await _webView.CoreWebView2.ExecuteScriptAsync(
                "(() => { LAB.select('pc20'); for (let i = 0; i < 8; i++) { LAB.active.update(0.016, i * 0.016, { diagram: LAB.active.diag, openCard: () => {} }); } LAB.fx.render(); return { active: LAB.active.id, parts: LAB.active.kit.parts.length, machines: LAB.machines.length, webgl2: !!LAB.renderer.capabilities.isWebGL2 }; })()"
            );

            await Task.Delay(250);

            if (!string.IsNullOrWhiteSpace(pngPath))
            {
                string? dir = Path.GetDirectoryName(pngPath);
                if (!string.IsNullOrEmpty(dir))
                {
                    Directory.CreateDirectory(dir);
                }
                using var fs = File.Create(pngPath);
                await _webView.CoreWebView2.CapturePreviewAsync(
                    CoreWebView2CapturePreviewImageFormat.Png,
                    fs
                );
            }

            File.WriteAllText(
                reportPath,
                $"VERIFY_UI_OK\nBoot={statusJson}\nPc20={pc20Check}\nUrl={_baseUrl}\n",
                Encoding.UTF8
            );
            VerifyExitCode = 0;
        }
        catch (Exception ex)
        {
            File.WriteAllText(reportPath, "VERIFY_ERR: " + ex, Encoding.UTF8);
            VerifyExitCode = 9;
        }
        finally
        {
            Close();
        }
    }

    private void SwitchToBrowserHostFallback(string url)
    {
        // Keep LoopbackLabServer alive while the external browser window is open!
        Controls.Remove(_webView);
        WindowState = FormWindowState.Normal;
        Size = new Size(520, 200);
        CenterToScreen();

        var lbl = new Label
        {
            Dock = DockStyle.Fill,
            TextAlign = ContentAlignment.MiddleCenter,
            Font = new Font("Segoe UI", 10f),
            ForeColor = Color.FromArgb(230, 237, 243),
            BackColor = Color.FromArgb(7, 11, 16),
            Padding = new Padding(18),
            Text =
                $"Computer Evolution Lab is running in your browser at:\n{url}\n\nKeep this window open while using the Lab (closing it stops the local server).",
        };
        Controls.Add(lbl);

        LaunchBrowserAppFallback(url);
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
    private static readonly Dictionary<string, string> MimeTypes = new(
        StringComparer.OrdinalIgnoreCase
    )
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
        [".mp3"] = "audio/mpeg",
        [".wav"] = "audio/wav",
        [".ogg"] = "audio/ogg",
        [".md"] = "text/markdown; charset=utf-8",
    };

    private readonly string? _rootDir;
    private readonly Dictionary<string, byte[]> _embedded;
    private readonly TcpListener _listener;
    private readonly CancellationTokenSource _cts = new();

    public string BaseUrl { get; private set; } = "";

    public LoopbackLabServer(string? rootDir, Dictionary<string, byte[]> embedded)
    {
        _rootDir = rootDir is not null ? Path.GetFullPath(rootDir) : null;
        _embedded = embedded;
        _listener = new TcpListener(IPAddress.Loopback, 0);
    }

    public void Start()
    {
        _listener.Start(128);
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
                if (!urlPath.StartsWith('/'))
                {
                    urlPath = "/" + urlPath;
                }

                byte[]? body = null;
                if (_rootDir is not null)
                {
                    string relPath = urlPath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
                    string fullPath = Path.GetFullPath(Path.Combine(_rootDir, relPath));
                    if (
                        fullPath.StartsWith(_rootDir, StringComparison.OrdinalIgnoreCase)
                        && File.Exists(fullPath)
                    )
                    {
                        body = await File.ReadAllBytesAsync(fullPath, ct);
                    }
                }

                if (body is null && _embedded.TryGetValue(urlPath, out byte[]? memBytes))
                {
                    body = memBytes;
                }

                if (body is null)
                {
                    await WriteResponseAsync(
                        stream,
                        "404 Not Found",
                        "text/plain; charset=utf-8",
                        Encoding.UTF8.GetBytes("Not Found"),
                        method == "HEAD",
                        ct
                    );
                }
                else
                {
                    string ext = Path.GetExtension(urlPath);
                    string mime = MimeTypes.TryGetValue(ext, out string? found)
                        ? found
                        : "application/octet-stream";
                    await WriteResponseAsync(stream, "200 OK", mime, body, method == "HEAD", ct);
                }

                try
                {
                    client.Client.Shutdown(SocketShutdown.Send);
                }
                catch { }
            }
            catch
            {
                // Client closed connection
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
            + "Access-Control-Allow-Origin: *\r\n"
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
    [DllImport("shell32.dll")]
    private static extern void SHChangeNotify(
        int wEventId,
        uint uFlags,
        IntPtr dwItem1,
        IntPtr dwItem2
    );

    [ComImport]
    [Guid("00021401-0000-0000-C000-000000000046")]
    private class ShellLink { }

    [ComImport]
    [InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    [Guid("000214F9-0000-0000-C000-000000000046")]
    private interface IShellLinkW
    {
        void GetPath(
            [Out, MarshalAs(UnmanagedType.LPWStr)] StringBuilder pszFile,
            int cchMaxPath,
            IntPtr pfd,
            int fFlags
        );
        void GetIDList(out IntPtr ppidl);
        void SetIDList(IntPtr pidl);
        void GetDescription(
            [Out, MarshalAs(UnmanagedType.LPWStr)] StringBuilder pszName,
            int cchMaxName
        );
        void SetDescription([MarshalAs(UnmanagedType.LPWStr)] string pszName);
        void GetWorkingDirectory(
            [Out, MarshalAs(UnmanagedType.LPWStr)] StringBuilder pszDir,
            int cchMaxPath
        );
        void SetWorkingDirectory([MarshalAs(UnmanagedType.LPWStr)] string pszDir);
        void GetArguments(
            [Out, MarshalAs(UnmanagedType.LPWStr)] StringBuilder pszArgs,
            int cchMaxPath
        );
        void SetArguments([MarshalAs(UnmanagedType.LPWStr)] string pszArgs);
        void GetHotkey(out short pwHotkey);
        void SetHotkey(short wHotkey);
        void GetShowCmd(out int piShowCmd);
        void SetShowCmd(int iShowCmd);
        void GetIconLocation(
            [Out, MarshalAs(UnmanagedType.LPWStr)] StringBuilder pszIconPath,
            int cchIconPath,
            out int piIcon
        );
        void SetIconLocation([MarshalAs(UnmanagedType.LPWStr)] string pszIconPath, int iIcon);
        void SetRelativePath(
            [MarshalAs(UnmanagedType.LPWStr)] string pszPathRel,
            int dwReserved
        );
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
        void Save(
            [MarshalAs(UnmanagedType.LPWStr)] string pszFileName,
            [MarshalAs(UnmanagedType.Bool)] bool fRemember
        );
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

    public static int InstallStartMenuShortcut(string? labRoot)
    {
        try
        {
            string exePath =
                Environment.ProcessPath
                ?? Path.Combine(
                    labRoot ?? AppContext.BaseDirectory,
                    "Computer Evolution Lab.exe"
                );
            string workDir = labRoot ?? Path.GetDirectoryName(exePath) ?? AppContext.BaseDirectory;
            string? icoPath =
                labRoot is not null
                    ? Path.Combine(labRoot, "assets", "icon", "computer-evolution-lab.ico")
                    : null;

            string programsDir = Environment.GetFolderPath(Environment.SpecialFolder.Programs);
            Directory.CreateDirectory(programsDir);
            string lnkPath = Path.Combine(programsDir, "Computer Evolution Lab.lnk");

            CreateShortcutWithAppId(
                lnkPath,
                exePath,
                workDir,
                "Computer Evolution Lab — Interactive 4K 3D Architecture & Computing Museum (17 Operational Computers)",
                icoPath is not null && File.Exists(icoPath) ? icoPath : exePath,
                Program.AppUserModelId
            );

            // Refresh Windows Explorer icon cache so custom icon renders immediately
            try
            {
                SHChangeNotify(0x08000000, 0x0000, IntPtr.Zero, IntPtr.Zero);
            }
            catch { }

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
