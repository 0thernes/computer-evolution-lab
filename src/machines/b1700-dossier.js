// Burroughs B1700 dossier: in-app data, mirrored in docs/B1700.md. Every entry names its
// source; every link was checked to resolve on 2026-11-18 (see docs/B1700.md for method).
// Nothing here is invented: where a fact was searched for and not found, the entry says so.
var B1700_DOSSIER = (() => {
  const BS = "https://www.bitsavers.org/pdf/burroughs/SmallSystems/B1000/";
  const L = (label, url) => ({ label, url });
  return {
    title: "Burroughs B1700 — sourced dossier",
    note: "Facts below come from the cited documents. 'Not found' means it was searched for and no primary source turned up; nothing has been filled in by guesswork.",
    sections: [
      {
        h: "Dates",
        items: [
          { text: "1968: 'Proper Language Processor' (PLP) research at the Burroughs Pasadena plant (Bunker et al., ETM 313), cited by Wikipedia as the B1700's origin.", links: [L("Wikipedia: Burroughs B1000 series", "https://en.wikipedia.org/wiki/Burroughs_B1000_series")] },
          { text: "28 June 1971: Roger E. Packard (Santa Barbara) files the 'Variable word width processor control' patent, US 3,739,352, assigned to Burroughs; granted 12 June 1973.", links: [L("Patent scan (bitsavers)", BS + "B1700/Patent_3739352.pdf")] },
          { text: "May 1972: W. T. Wilner, 'B1700 Design and Implementation', Burroughs Santa Barbara Plant technical report.", links: [L("bitsavers", BS + "B1000_Internal_Memos/Wilner_B1700_Design_and_Implementation_197205.pdf")] },
          { text: "7 June 1972: B1700 series announced (Datapro 70C-112-04). B1712/B1714 deliveries began Q3 1972, the B1726 Q2 1973; the B1728 was added in July 1973. Over 1,000 orders and over 400 deliveries by October 1973 (Datapro, Nov 1973).", links: [L("Datapro 1972-07", "https://www.bitsavers.org/pdf/burroughs/Burroughs_DataPro_Reports/70C-112-04_7207_Burroughs_B1700.pdf"), L("Datapro 1973-11", "https://www.bitsavers.org/pdf/burroughs/Burroughs_DataPro_Reports/70C-112-04_7311_Burroughs_B1700.pdf")] },
          { text: "Later line (Datapro, Aug 1976): B 1728 added July 1973, B 1718 a year later, B 1716 March 1975; six B 1714-based models (B 1705–B 1717) announced October 1975; B 1720-based systems including the B 1776 in April 1976. Well over 1,300 B 1700 systems delivered by January 1976 'according to industry sources'.", links: [L("Datapro 1976-08", "https://www.bitsavers.org/pdf/burroughs/Burroughs_DataPro_Reports/70C-112-04_7608_Burroughs_B1700.pdf")] },
          { text: "June 1972: B 1726 brochure (form 1059219) gives the cabinet and table dimensions used in this scene.", links: [L("front", BS + "B1000_Brochures/1059219_B1726/1059219_B1726_front_jun72.jpg"), L("back", BS + "B1000_Brochures/1059219_B1726/1059219_B1726_back_jun72.jpg")] },
          { text: "December 1972: Wilner's 'Design of the Burroughs B1700' appears in the proceedings of the AFIPS Fall Joint Computer Conference (5–7 December 1972).", links: [L("doi:10.1145/1479992.1480060", "https://doi.org/10.1145/1479992.1480060")] },
          { text: "1969: Burroughs moves to Goleta (6300 Hollister Ave.); leases and in 1973 buys the building. 11 June 1981: Goleta Valley News reports the plant (592 employees, manager Steve Schmidt) is to be phased out, product development moving to Pasadena and Mission Viejo.", links: [L("clipping (bitsavers)", "https://www.bitsavers.org/pdf/burroughs/SmallSystems/Goleta_Plant_Closure_19810611.jpg")] },
        ],
      },
      {
        h: "People (roles as stated in the sources)",
        items: [
          { text: "Wayne T. Wilner, Burroughs Corporation, Goleta CA: author of the 1972 design papers. A Trinity College Dublin collection record calls him the B1700's principal designer.", links: [L("TCD record", "https://treasures.scss.tcd.ie/hardware/TCD-SCSS-T.20121208.032/TCD-SCSS-T.20121208.032.pdf")] },
          { text: "Roger E. Packard, Santa Barbara: named inventor of US 3,739,352, the variable-word-width processor control." },
          { text: "Donald R. McCrea, Santa Barbara Plant, Goleta: author of 'Software Development Language for the Burroughs B1700' (SDL, the systems language that MCP and the compilers are written in).", links: [L("bitsavers", BS + "B1000_Internal_Memos/McCrea_-_Software_Development_Language_for_the_Burroughs_B1700.pdf")] },
          { text: "R. S. Barton: Wilner credits him with first articulating many of the design objectives." },
          { text: "Brian Randell, R. R. Johnson, Rod Bunker, Dean Earnest and Harvey Bingham: thanked by Wilner for criticising drafts. That is their only role the source states." },
          { text: "Not found: a full staff list of the design team, or named hardware engineers beyond those above." },
        ],
      },
      {
        h: "Papers",
        items: [
          { text: "W. T. Wilner, 'Design of the Burroughs B1700', AFIPS FJCC 1972, pp. 489–497.", links: [L("doi:10.1145/1479992.1480060", "https://doi.org/10.1145/1479992.1480060")] },
          { text: "W. T. Wilner, 'Burroughs B1700 memory utilization', AFIPS FJCC 1972, p. 579 ff.", links: [L("doi:10.1145/1479992.1480074", "https://doi.org/10.1145/1479992.1480074")] },
          { text: "W. T. Wilner, 'Microprogramming environment on the Burroughs B1700', IEEE CompCon '72. No DOI found." },
          { text: "W. T. Wilner, 'Structured programs, Arcadian machines and the Burroughs B1700', 3. Fachtagung über Programmiersprachen, 1974. No DOI found." },
          { text: "W. T. Wilner, 'Unconventional architecture', ACM Annual Conference 1976, p. 223.", links: [L("doi:10.1145/800191.805582", "https://doi.org/10.1145/800191.805582")] },
          { text: "E. I. Organick and J. A. Hinds, Interpreting Machines (North-Holland, 1978; ISBN 978-0-444-00242-6), a book-length study of the B1700/B1800.", links: [L("bitsavers PDF", BS + "B1700/Organick_-_Interpreting_Machines_1978.pdf")] },
        ],
      },
      {
        h: "Manuals and specifications (bitsavers)",
        items: [
          { text: "B 1700 Systems Reference Manual 1057155 (1972-04 and 1973-01 editions). Primary source for the micro-instructions emulated here.", links: [L("1973-01", BS + "B1700/1057155_B1700_System_Reference_Manual_197301.pdf"), L("1972-04", BS + "B1700/1057155_B1700_System_Reference_Manual_197204.pdf")] },
          { text: "MIL, Micro Implementation Language 2212-5298. Source for the assembler syntax and the EXTRACT example used in the tests.", links: [L("bitsavers", BS + "B1000_Internal_Memos/2212-5298_MIL_Micro_Implementation_Language.pdf")] },
          { text: "B1700 Field Engineering Technical Manual 1053360 (1972-11, 1973-05).", links: [L("1973-05", BS + "B1700/1053360_B1700_FE_Technical_Manual_197305.pdf")] },
          { text: "Auerbach report on the B1700 (July 1974). Source for the 167 ns and 667 ns timings.", links: [L("bitsavers", BS + "B1700/Auerbach_Burroughs_B1700_197407.pdf")] },
          { text: "S-language specifications: COBOL (2201-6729B, 1971), SDL (2201-2389H, 1975), FORTRAN (2201-6737D, 1978), BASIC (24 May 1973).", links: [L("COBOL", BS + "B1000_Internal_Memos/2201-6729B_COBOL_S-Lang_1971.pdf"), L("SDL", BS + "B1000_Internal_Memos/2201-2389H_SDL_S-Lang_197511.pdf"), L("FORTRAN", BS + "B1000_Internal_Memos/2201-6737D_FORTRAN_S-Lang_197807.pdf"), L("BASIC", BS + "B1000_Internal_Memos/BASIC_S-Language_19730524.pdf")] },
        ],
      },
      {
        h: "Advertising, brochures, film",
        items: [
          { text: "'COBOL, FORTRAN, RPG, BASIC Spoken Here' advertisement for 'Burroughs' revolutionary B 1700 Systems', Datamation, February 1973, p. 6.", links: [L("Datamation 1973-02 (bitsavers)", "https://www.bitsavers.org/magazines/Datamation/197302.pdf")] },
          { text: "Burroughs Small Business Systems advertisement, 1973 (mentions B 1700 Systems).", links: [L("bitsavers", "https://www.bitsavers.org/pdf/burroughs/Ads/Burroughs_Small_Business_Systems_Ad_1973.pdf")] },
          { text: "Brochures: B 1712 (1058955), B 1714 (1058963), B 1726 (1059219, June 1972), B 1700 (1066149, March 1973), plus a July 1973 series on variable micrologic, virtual memory and more.", links: [L("brochure folder", BS + "B1000_Brochures/")] },
          { text: "Catalogue photographs (Burroughs press photos M B1700-…).", links: [L("bitsavers pictures", BS + "B1700/pictures/")] },
          { text: "Third-party photo gallery with a B1700 'advertising shoot' photograph and console pictures (Newcastle University, Ole Hagen Jensen).", links: [L("picklesnet gallery", "https://www.picklesnet.com/burroughs/gallery/bpgb1700.htm")] },
          { text: "Burroughs Corporation records, videotapes and films (CBI 90, series 105, 1957–1989): the finding aid lists commercials and advertising among its contents; no B1700-specific commercial is named online.", links: [L("CBI finding aid", "https://archives.lib.umn.edu/repositories/3/resources/3839")] },
          { text: "Film: 'B1700 Presentation' (Burroughs Corporation, catalogued 1980, CBI identifier BP-040). The catalogue describes it as an introduction to the B1700 and to Burroughs, with views of the new Detroit headquarters. Digitised at UMN UMedia.", links: [L("UMN UMedia item", "https://umedia.lib.umn.edu/item/p16022coll90:64")] },
          { text: "TV commercial: not found. No B1700 television commercial was located in bitsavers, CBI/UMedia, the Computer History Museum or general web searches." },
        ],
      },
    ],
  };
})();
if (typeof window !== "undefined") window.B1700_DOSSIER = B1700_DOSSIER;
