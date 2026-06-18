export type FishInfo = {
  name: string;
  minLength: string;
  closedSeason: string;
  bestBaits: string;
  tips: string;
  image: string; // KORREKTUR: Aus 'icon' wird ein echter Bild-Link!
  category: "Raubfisch" | "Friedfisch" | "Salmonide" | "Meeresfisch";
};

export const FISCH_LEXIKON: FishInfo[] = [
  // ==========================================================================
  // 1. RAUBFISCHE
  // ==========================================================================
  {
    name: "Hecht",
    minLength: "50 - 60 cm",
    closedSeason: "15.02. - 30.04.",
    bestBaits: "Gummifisch, Blinker, Wobbler, Köderfisch",
    tips: "Steht oft an Krautkanten und Unterständen. Im Frühjahr flach fischen!",
    image: "/fische/Hecht.jpg",
    category: "Raubfisch",
  },
  {
    name: "Zander",
    minLength: "45 - 50 cm",
    closedSeason: "15.03. - 31.05.",
    bestBaits: "No-Action-Shads, Gummifisch, Schlanke Wobbler",
    tips: "Lichtscheuer Jäger. Beste Beißzeit in der Dämmerung und Nacht an Steinpackungen.",
    image: "/fische/Zander.jpg",
    category: "Raubfisch",
  },
  {
    name: "Flussbarsch",
    minLength: "Keines (Frei)",
    closedSeason: "Keine",
    bestBaits: "Kleine Gummifische, Spinner, Tauwurm, Drop-Shot",
    tips: "Sucht Strukturen wie Brückenpfeiler oder versunkene Bäume. Häufig im dichten Schwarm!",
    image: "/fische/Flussbarsch.jpg",
    category: "Raubfisch",
  },
  {
    name: "Wels (Waller)",
    minLength: "70 - 80 cm",
    closedSeason: "Regional (oft keine)",
    bestBaits: "Tauwurmbündel, Tintenfisch, Großer Köderfisch",
    tips: "Unser größter Raubfisch. Beißt besonders gut in warmen Sommernächten und bei Hochwasser.",
    image: "/fische/Wels.jpg",
    category: "Raubfisch",
  },
  {
    name: "Rappfen (Schied)",
    minLength: "40 cm",
    closedSeason: "01.04. - 31.05.",
    bestBaits: "Topwater-Körper, Schnell geführte Wobbler und Blinker",
    tips: "Raubt extrem spektakulär an der Oberfläche in harten Strömungskanten und Wehrschüssen.",
    image: "/fische/Rappfen.jpg",
    category: "Raubfisch",
  },
  {
    name: "Aal",
    minLength: "45 - 50 cm",
    closedSeason: "Regional (oft Herbst/Winter)",
    bestBaits: "Tauwurm, Mistwurm, Köderfisch, Fischfetzen",
    tips: "Nachtaktiver Grundräuber. Sucht Deckung unter Ufergehölz. Feine Grundmontagen nutzen.",
    image: "/fische/Aal.jpg",
    category: "Raubfisch",
  },
  {
    name: "Döbel (Aitel)",
    minLength: "Keines",
    closedSeason: "Keine",
    bestBaits: "Kirschen, Brotflocke, Spinner, kleine Wobbler",
    tips: "Extrem misstrauisch. Perfekt für die Pirsch im Sommer mit Schwimmbrot an der Oberfläche.",
    image: "/fische/Doebel.jpg",
    category: "Raubfisch",
  },
  // ==========================================================================
  // 2. FRIEDFISCHE
  // ==========================================================================
  {
    name: "Karpfen (Spiegel/Schuppen)",
    minLength: "35 - 40 cm",
    closedSeason: "Keine",
    bestBaits: "Boilies, Pellets, Dosenmais, Tigerbrot, Hartmais",
    tips: "Ausgiebiges Vorfüttern über mehrere Tage steigert die Chancen massiv. Krautnahe Plätze suchen!",
    image: "/fische/Karpfen.jpg",
    category: "Friedfisch",
  },
  {
    name: "Schleie",
    minLength: "25 cm",
    closedSeason: "01.05. - 30.06. (Regional)",
    bestBaits: "Mistwurmbündel, Maden, Mais, Mini-Boilies",
    tips: "Der 'Geist des Krautgartens'. Beißt extrem vorsichtig in krautreichen, schlammigen Uferzonen.",
    image: "/fische/Schleie.jpg",
    category: "Friedfisch",
  },
  {
    name: "Brachse (Brassen)",
    minLength: "Keines",
    closedSeason: "Keine",
    bestBaits: "Maden, Casters, Mistwurm, Futterkorb-Mix",
    tips: "Zieht im Schwarm über den Gewässergrund. Perfekt fürs Match- und Feederangeln.",
    image: "/fische/Brachse.jpg",
    category: "Friedfisch",
  },
  {
    name: "Rotauge (Plötze)",
    minLength: "Keines",
    closedSeason: "Keine",
    bestBaits: "Maden, Hanf, Brot, Pinkies",
    tips: "Der am häufigsten vorkommende Friedfisch. Beißt das ganze Jahr über auf feine Posenmontagen.",
    image: "/fische/Rotauge.jpg",
    category: "Friedfisch",
  },
  {
    name: "Rotfeder",
    minLength: "Keines",
    closedSeason: "Keine",
    bestBaits: "Maden, Brotflocke, Fliegen",
    tips: "Steht im Gegensatz zum Rotauge meist oberflächennah in dichten Seerosenfeldern.",
    image: "/fische/Rotfeder.jpg",
    category: "Friedfisch",
  },
  {
    name: "Barbe",
    minLength: "40 cm",
    closedSeason: "01.05. - 15.06.",
    bestBaits: "Käse (z.B. Gouda), Frühstücksfleisch, Maden, Pellets",
    tips: "Starker Kämpfer in der harten Flussströmung. Grundblei- oder Feedermontage flussaufwärts fischen.",
    image: "/fische/Barbe.jpg",
    category: "Friedfisch",
  },
  {
    name: "Graskarpfen (Amur)",
    minLength: "Regional",
    closedSeason: "Keine",
    bestBaits: "Schwimmbrot, Mais, Kirschen, Salatblätter",
    tips: "Wurde zur Krautbekämpfung eingesetzt. Liefert explosive, extrem harte Drills am Ufer.",
    image: "/fische/Graskarpfen.jpg",
    category: "Friedfisch",
  },
  {
    name: "Nase",
    minLength: "Regional geschützt",
    closedSeason: "01.03. - 30.04.",
    bestBaits: "Maden, Algenflocken, Brot",
    tips: "Typischer Flussfisch, der mit seinem harten Maul Algen von Steinen schabt. Oft geschützt.",
    image: "/fische/Nase.jpg",
    category: "Friedfisch",
  },
  // ==========================================================================
  // 3. SALMONIDEN (EDELFISCHE)
  // ==========================================================================
  {
    name: "Bachforelle",
    minLength: "25 - 30 cm",
    closedSeason: "01.10. - 28.02.",
    bestBaits: "Kleine Spinner, Spoons, Wobbler, Trockenfliege, Nymphe",
    tips: "Standorttreu in schnellen Bächen. Sucht Unterstände unter Steinen und Prallufern. Vorsichtig anpirschen!",
    image: "/fische/Bachforelle.jpg",
    category: "Salmonide",
  },
  {
    name: "Regenbogenforelle",
    minLength: "25 cm",
    closedSeason: "Regional (oft Winter)",
    bestBaits: "Forellenteig, Spoons, kleine Spinner, Fliegen",
    tips: "Kampfstarker Import aus Amerika. Jagt agiler im Freiwasser als die Bachforelle.",
    image: "/fische/Regenbogenforelle.jpg",
    category: "Salmonide",
  },
  {
    name: "Äsche",
    minLength: "30 - 35 cm",
    closedSeason: "01.03. - 30.04.",
    bestBaits: "Trockenfliege, Nymphe, kleine künstliche Fliegen",
    tips: "Erkennbar an der riesigen Rückenflosse (Fahne). Extrem empfindlich gegenüber Gewässerverschmutzung.",
    image: "/fische/Aesche.jpg",
    category: "Salmonide",
  },
  {
    name: "Saibling (Bach/Seesaibling)",
    minLength: "25 - 30 cm",
    closedSeason: "01.10. - 28.02.",
    bestBaits: "Kleine Blinker, Kunstfliegen, Maden",
    tips: "Wunderschön gefärbter Fisch. Liebt eiskaltes, glasklares und tiefes Quellwasser.",
    image: "/fische/Saibling.jpg",
    category: "Salmonide",
  },

  // ==========================================================================
  // 4. MEERESFISCHE (DEUTSCHE KÜSTEN)
  // ==========================================================================
  {
    name: "Dorsch (Kabeljau)",
    minLength: "35 - 38 cm",
    closedSeason: "Regional schwankend (Bag-Limit beachten!)",
    bestBaits: "Gummifisch, Pilker, Wattwurm (beim Brandungsangeln)",
    tips: "Der König der Ostsee. Sucht krautige Mischgründe ('Leopardengrund'). Bestände aktuell stark geschützt.",
    image: "/fische/Hecht.jpg",
    category: "Meeresfisch",
  },
  {
    name: "Meerforelle",
    minLength: "40 - 45 cm",
    closedSeason: "01.10. - 31.12. (Küste)",
    bestBaits: "Schlanke Blinker, Sandaal-Imitate, Meerforellenfliegen",
    tips: "Der 'Fisch der 1000 Würfe'. Wate im Frühjahr und Herbst ausgiebig an den Stränden der Ostsee.",
    image: "/fische/Hecht.jpg",
    category: "Meeresfisch",
  },
  {
    name: "Hornhecht",
    minLength: "Keines",
    closedSeason: "Keine",
    bestBaits: "Heringsfetzen, Schlanke Blinker, Seeringelwurm",
    tips: "Zieht im Mai ('Wenn der Raps blüht') in riesigen Schwärmen zur Eiablage an die Ostseeküste.",
    image: "/fische/Hecht.jpg",
    category: "Meeresfisch",
  },
  {
    name: "Makrele",
    minLength: "Keines",
    closedSeason: "Keine",
    bestBaits: "Makrelen-Paternoster (Glitzerfliegen), kleine Pilker",
    tips: "Pfeilschneller Ufer- und Bootsschwarmfisch. Zieht im Hochsommer in die Nordsee und in Förden ein.",
    image: "/fische/Hecht.jpg",
    category: "Meeresfisch",
  },
  {
    name: "Flunder / Scholle (Plattfische)",
    minLength: "25 cm",
    closedSeason: "Regional (oft Weibchenschutz im Winter)",
    bestBaits: "Wattwurm, Seeringelwurm",
    tips: "Klassisches Brandungsangeln im Herbst bei auflandigem Wind. Suchen den Uferbereich nachts nach Nahrung ab.",
    image: "/fische/Hecht.jpg",
    category: "Meeresfisch",
  },
  {
    name: "Hering",
    minLength: "Keines",
    closedSeason: "Keine",
    bestBaits: "Herings-Paternoster (Echte Fischhaut-Haken)",
    tips: "Das 'Silber des Meeres'. Zieht im zeitigen Frühjahr zum Laichen in die Häfen (z.B. Kiel, Rostock).",
    image: "/fische/Hecht.jpg",
    category: "Meeresfisch",
  },
];
