/* Tabular data behind the three maps. Sources are listed in README.md and in the page footer. */

// RGI first-order glacier regions.
// area, count: Randolph Glacier Inventory 7.0 (glacier state around the year 2000).
// rate: regional glacier area change, % of area per year (compiled from IPCC AR5 and later
//       literature by Zemp et al. 2019; the values used by GlaMBIE 2025).
// smb, gt: mean mass change 2000-2023, metres water equivalent per year and gigatonnes per year
//       (The GlaMBIE Team 2025, Table 1).
const REGIONS = [
  { id: 1,  name: "Alaska",                           area: 86708,  count: 27509, rate: -0.48, smb: -0.72, gt: -60.8, pt: [-146.0, 61.6], zoom: 3.4 },
  { id: 2,  name: "Western Canada and USA",           area: 14521,  count: 18730, rate: -0.54, smb: -0.68, gt: -9.0,  pt: [-121.5, 51.2], zoom: 3.4 },
  { id: 3,  name: "Arctic Canada North",              area: 105370, count: 5216,  rate: -0.07, smb: -0.29, gt: -30.5, pt: [-82.0, 79.6],  zoom: 2.8 },
  { id: 4,  name: "Arctic Canada South",              area: 40538,  count: 11009, rate: -0.08, smb: -0.57, gt: -23.1, pt: [-71.5, 69.2],  zoom: 3.0 },
  { id: 5,  name: "Greenland Periphery",              area: 90482,  count: 19994, rate: -0.82, smb: -0.44, gt: -35.1, pt: [-26.0, 71.6],  zoom: 2.6 },
  { id: 6,  name: "Iceland",                          area: 11060,  count: 568,   rate: -0.36, smb: -0.79, gt: -8.3,  pt: [-18.4, 64.6],  zoom: 4.6 },
  { id: 7,  name: "Svalbard and Jan Mayen",           area: 33959,  count: 1666,  rate: -0.26, smb: -0.41, gt: -13.7, pt: [18.0, 78.8],   zoom: 3.6 },
  { id: 8,  name: "Scandinavia",                      area: 2948,   count: 3410,  rate: -0.27, smb: -0.58, gt: -1.7,  pt: [8.6, 61.6],    zoom: 3.8 },
  { id: 9,  name: "Russian Arctic",                   area: 51595,  count: 1069,  rate: -0.08, smb: -0.32, gt: -16.1, pt: [58.0, 75.6],   zoom: 2.8 },
  { id: 10, name: "North Asia",                       area: 2643,   count: 7155,  rate: -0.43, smb: -0.56, gt: -1.3,  pt: [88.0, 49.6],   zoom: 2.6 },
  { id: 11, name: "Central Europe",                   area: 2124,   count: 4079,  rate: -0.93, smb: -1.06, gt: -2.0,  pt: [9.6, 46.5],    zoom: 4.6 },
  { id: 12, name: "Caucasus and Middle East",         area: 1407,   count: 2275,  rate: -0.53, smb: -0.62, gt: -0.7,  pt: [43.4, 42.9],   zoom: 4.4 },
  { id: 13, name: "Central Asia",                     area: 50344,  count: 75613, rate: -0.18, smb: -0.22, gt: -10.4, pt: [80.4, 41.9],   zoom: 3.4 },
  { id: 14, name: "South Asia West",                  area: 33075,  count: 37562, rate: -0.36, smb: -0.17, gt: -5.4,  pt: [75.4, 35.7],   zoom: 4.2 },
  { id: 15, name: "South Asia East",                  area: 16049,  count: 18587, rate: -0.47, smb: -0.52, gt: -7.3,  pt: [87.6, 28.0],   zoom: 4.0 },
  { id: 16, name: "Low Latitudes",                    area: 1929,   count: 3695,  rate: -1.19, smb: -0.38, gt: -0.8,  pt: [-77.4, -9.3],  zoom: 3.4 },
  { id: 17, name: "Southern Andes",                   area: 27674,  count: 30634, rate: -0.18, smb: -0.93, gt: -26.5, pt: [-73.4, -48.8], zoom: 3.2 },
  { id: 18, name: "New Zealand",                      area: 886,    count: 3018,  rate: -0.69, smb: -0.96, gt: -0.8,  pt: [170.3, -43.6], zoom: 4.6 },
  { id: 19, name: "Subantarctic and Antarctic Islands", area: 133432, count: 2742, rate: -0.27, smb: -0.14, gt: -16.9, pt: [-62.5, -65.5], zoom: 2.2 }
];

const WORLD = { area: 706744, count: 274531, gt: -273, smb: -0.41 };

// Area-change classes for Map 02 (absolute value, % per year). One hue, light to dark.
const RATE_CLASSES = [
  { max: 0.10, color: "#F1CDB4", label: "under 0.1" },
  { max: 0.30, color: "#E69C74", label: "0.1 – 0.3" },
  { max: 0.50, color: "#D36B49", label: "0.3 – 0.5" },
  { max: 0.90, color: "#AE3B2E", label: "0.5 – 0.9" },
  { max: 9,    color: "#74192B", label: "0.9 and more" }
];

// Peak-water groups for Map 03.
const PEAK_CLASSES = {
  rising: {
    color: "#0A9F96",
    name: "More water now, less later",
    short: "Peak around mid-century",
    text: "Glacier melt is still adding water to these rivers. Models put the peak around the middle of the century; after it, summer flow drops below what people rely on today."
  },
  past: {
    color: "#C4472B",
    name: "At or past the peak",
    short: "At or past peak",
    text: "Small, fast-shrinking glaciers. The melt bonus is over or ending, and glacier-fed summer flow is already declining in places."
  },
  late: {
    color: "#5A4FCF",
    name: "Peak late in the century",
    short: "Peak after about 2050",
    text: "Big glaciers and high ice cover. Melt keeps rising for decades, so shortage is not the near-term problem here."
  },
  unknown: {
    color: "#6F7B83",
    name: "Large losses expected, timing not given",
    short: "Timing not given",
    text: "Named among the most affected basins by 2100, but the sources used here give no peak year for them."
  }
};

// Glacier-fed basins shown on Map 03.
// glac: glacier cover of the basin in percent (Huss & Hock 2018, Fig. 2), where published.
// loss10: basin named by Huss & Hock (2018) among those losing at least 10% of runoff
//         in at least one melt-season month by the end of the century.
const BASINS = [
  { id: "indus", name: "Indus", cls: "rising", glac: "2.4", loss10: true, pt: [70.9, 29.6], lz: 0,
    countries: ["PAK", "IND", "CHN", "AFG"],
    note: "Glacier runoff rises until roughly mid-century, then declines (Huss & Hock 2018). Headwater studies put the peak near 2050 (Lutz et al. 2014)." },
  { id: "aral", name: "Aral Sea basin", sub: "Amu Darya and Syr Darya", cls: "rising", glac: "1.2", loss10: true, pt: [62.6, 42.4], lz: 0,
    countries: ["TJK", "KGZ", "UZB", "TKM", "KAZ", "AFG"],
    note: "Runoff from Pamir and Tien Shan glaciers rises until about mid-century, then declines (Huss & Hock 2018). Pamir and Hissar-Alay: peak near 2050 (Lyu et al. 2024)." },
  { id: "tarim", name: "Tarim", cls: "rising", glac: "2.3", loss10: true, pt: [84.6, 40.9], lz: 0,
    countries: ["CHN", "KGZ"],
    note: "Rises until about mid-century, then declines (Huss & Hock 2018). The heavily glacierised West Kunlun peaks later, around 2070–2080 (Lyu et al. 2024)." },
  { id: "brahmaputra", name: "Brahmaputra", cls: "rising", glac: "3.2", loss10: false, pt: [92.6, 26.4], lz: 0,
    countries: ["CHN", "IND", "BTN", "BGD"],
    note: "Rises until about mid-century, then declines (Huss & Hock 2018). Eastern Himalaya glaciers themselves peak earlier, in the 2020s (Lyu et al. 2024)." },
  { id: "ganges", name: "Ganges", cls: "rising", glac: "1.1", loss10: false, pt: [82.4, 25.4], lz: 0,
    countries: ["IND", "NPL", "BGD", "CHN"],
    note: "Headwaters of the Ganges, Indus and Brahmaputra peak near 2050 under RCP4.5 (Lutz et al. 2014, in IPCC SROCC)." },
  { id: "balkhash", name: "Lake Balkhash basin", sub: "Ili", cls: "rising", glac: "0.9", loss10: true, pt: [76.2, 44.6], lz: 0,
    countries: ["KAZ", "CHN"],
    note: "Fed by the Tien Shan, where peak water arrives between the 2020s (east) and the 2030s–2050 (west) depending on the scenario (Lyu et al. 2024). Among the most affected basins by 2100 (Huss & Hock 2018)." },

  { id: "santa", name: "Santa", cls: "past", glac: null, loss10: true, pt: [-78.3, -9.0], lz: 0,
    countries: ["PER"],
    note: "River records from the Cordillera Blanca show peak water already passed (Baraer et al. 2012; Carey et al. 2014). In the tropical Andes 82–95% of glacier area was past its peak before 2019 (IPCC SROCC)." },
  { id: "rhone", name: "Rhône", cls: "past", glac: "0.9", loss10: false, pt: [4.8, 44.3], lz: 0,
    countries: ["CHE", "FRA"],
    note: "In Central Europe and the Caucasus 55–67% of glacier area was past its peak before 2019 (IPCC SROCC). The largest Alpine glaciers still peak between 2020 and 2050." },
  { id: "rhine", name: "Rhine", cls: "past", glac: "0.1", loss10: false, pt: [7.6, 50.4], lz: 2.6,
    countries: ["CHE", "DEU", "FRA", "NLD", "AUT", "LIE"],
    note: "In Central Europe and the Caucasus 55–67% of glacier area was past its peak before 2019 (IPCC SROCC)." },
  { id: "po", name: "Po", cls: "past", glac: "0.5", loss10: false, pt: [11.4, 45.0], lz: 2.6,
    countries: ["ITA", "CHE"],
    note: "In Central Europe and the Caucasus 55–67% of glacier area was past its peak before 2019 (IPCC SROCC)." },
  { id: "kuban", name: "Kuban", cls: "past", glac: "0.2", loss10: false, pt: [39.6, 45.2], lz: 2.2,
    countries: ["RUS"],
    note: "In Central Europe and the Caucasus 55–67% of glacier area was past its peak before 2019 (IPCC SROCC)." },
  { id: "fraser", name: "Fraser", cls: "past", glac: null, loss10: true, pt: [-122.4, 52.4], lz: 0,
    countries: ["CAN"],
    note: "In Western Canada and the USA 40–49% of glacier area was past its peak before 2019 (IPCC SROCC); several basins there are already past peak water (Fleming & Dahlke 2014, in IPCC SROCC)." },
  { id: "skeena", name: "Skeena", cls: "past", glac: null, loss10: true, pt: [-128.4, 54.9], lz: 2.4,
    countries: ["CAN"],
    note: "In Western Canada and the USA 40–49% of glacier area was past its peak before 2019 (IPCC SROCC)." },
  { id: "columbia", name: "Columbia", cls: "past", glac: null, loss10: false, pt: [-119.4, 46.6], lz: 2.2,
    countries: ["CAN", "USA"],
    note: "The glacier-fed Mica headwaters passed peak water around 2000 (Jost et al. 2012, in IPCC SROCC)." },
  { id: "salween", name: "Salween", cls: "past", glac: "0.9", loss10: false, pt: [97.8, 19.6], lz: 2.2,
    countries: ["CHN", "MMR", "THA"],
    note: "Glaciers of south-east Tibet and the Hengduan Shan reach peak water around 2024 under every scenario (Lyu et al. 2024)." },

  { id: "copper", name: "Copper", cls: "late", glac: null, loss10: false, pt: [-144.8, 61.6], lz: 0,
    countries: ["USA"],
    note: "About a fifth of the basin is ice; peak water is projected near 2070 under RCP4.5 (Valentin et al. 2018, in IPCC SROCC)." },
  { id: "susitna", name: "Susitna", cls: "late", glac: null, loss10: false, pt: [-150.2, 62.4], lz: 2.4,
    countries: ["USA"],
    note: "Annual glacier runoff keeps rising beyond 2050 (Huss & Hock 2018)." },
  { id: "jokulsa", name: "Jökulsá", cls: "late", glac: null, loss10: false, pt: [-16.4, 65.7], lz: 0,
    countries: ["ISL"],
    note: "Annual glacier runoff keeps rising beyond 2050 (Huss & Hock 2018). Iceland's ice caps peak around 2055 (Björnsson & Pálsson 2008, in IPCC SROCC)." },

  { id: "colorado_ar", name: "Colorado", sub: "Argentina", cls: "unknown", glac: null, loss10: true, pt: [-66.4, -38.6], lz: 0,
    countries: ["ARG"],
    note: "Named among the basins with the largest monthly runoff reductions by 2100 (Huss & Hock 2018)." },
  { id: "baker", name: "Baker", cls: "unknown", glac: null, loss10: true, pt: [-72.9, -47.4], lz: 2.2,
    countries: ["CHL", "ARG"],
    note: "Named among the basins with the largest monthly runoff reductions by 2100 (Huss & Hock 2018)." },
  { id: "santacruz", name: "Santa Cruz", cls: "unknown", glac: null, loss10: true, pt: [-70.4, -50.2], lz: 0,
    countries: ["ARG"],
    note: "Named among the basins with the largest monthly runoff reductions by 2100 (Huss & Hock 2018)." },
  { id: "taku", name: "Taku", cls: "unknown", glac: null, loss10: true, pt: [-133.5, 58.7], lz: 2.4,
    countries: ["CAN", "USA"],
    note: "Named among the basins with the largest monthly runoff reductions by 2100 (Huss & Hock 2018)." },
  { id: "nass", name: "Nass", cls: "unknown", glac: null, loss10: true, pt: [-129.2, 55.6], lz: 3.0,
    countries: ["CAN"],
    note: "Named among the basins with the largest monthly runoff reductions by 2100 (Huss & Hock 2018)." }
];

const COUNTRY_NAMES = {
  PAK: "Pakistan", IND: "India", CHN: "China", AFG: "Afghanistan", TJK: "Tajikistan", KGZ: "Kyrgyzstan",
  UZB: "Uzbekistan", TKM: "Turkmenistan", KAZ: "Kazakhstan", BTN: "Bhutan", BGD: "Bangladesh", NPL: "Nepal",
  PER: "Peru", CHE: "Switzerland", FRA: "France", DEU: "Germany", NLD: "Netherlands", AUT: "Austria",
  LIE: "Liechtenstein", ITA: "Italy", RUS: "Russia", CAN: "Canada", USA: "United States", MMR: "Myanmar",
  THA: "Thailand", ISL: "Iceland", ARG: "Argentina", CHL: "Chile"
};
