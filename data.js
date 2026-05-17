// 18 TIPOS — slug (igual al PNG en pacodex/img/types/) + nombre visible + color oficial
const TYPES = {
  normal:    { name: "Normal",    color: "#9FA19F" },
  fuego:     { name: "Fuego",     color: "#E62829" },
  agua:      { name: "Agua",      color: "#2980EF" },
  planta:    { name: "Planta",    color: "#3FA129" },
  electrico: { name: "Eléctrico", color: "#FAC000" },
  hielo:     { name: "Hielo",     color: "#3DCEF3" },
  lucha:     { name: "Lucha",     color: "#FF8000" },
  veneno:    { name: "Veneno",    color: "#9141CB" },
  tierra:    { name: "Tierra",    color: "#915121" },
  volador:   { name: "Volador",   color: "#81B9EF" },
  psiquico:  { name: "Psíquico",  color: "#EF4179" },
  bicho:     { name: "Bicho",     color: "#91A119" },
  roca:      { name: "Roca",      color: "#AFA981" },
  fantasma:  { name: "Fantasma",  color: "#704170" },
  dragon:    { name: "Dragón",    color: "#5060E1" },
  siniestro: { name: "Siniestro", color: "#624D4E" },
  acero:     { name: "Acero",     color: "#60A1B8" },
  hada:      { name: "Hada",      color: "#EF70EF" },
};

// EPISODIOS
// Para agregar un episodio nuevo:
//   1. Copiar cualquier bloque { ... }, } y pegar al final (antes del ];).
//   2. Actualizar ep (número), id (# Pokédex nacional), name, generation, types, weight_kg.
//   3. cargado: true = ✅ Cargado  |  false = ❌ No cargado
//   4. Subir el thumbnail a img/thumbs/ y poner el nombre del archivo en thumbnail.
//   5. Si una red social no tiene video, dejar "" — el botón no aparecerá en el modal.
const EPISODES = [
  {
    ep: 1,
    id: 71,
    name: "Victreebel",
    generation: 1,
    types: ["planta", "veneno"],
    weight_kg: 15.5,
    cargado: true,
    thumbnail: "img/thumbs/victreebel.jpg",
    links: {
      youtube:   "https://youtube.com/shorts/xcCsWQa-CR8?si=o54S16vizUhBLEvX",
      tiktok:    "https://www.tiktok.com/@pacomedtej_/video/7629887286859091221",
      instagram: "https://www.instagram.com/reel/DXQJRBLEVxJ/?igsh=YTRxMTVzcHprNnQ5",
      facebook:  "https://www.facebook.com/share/v/1GY3pCq9ou/?mibextid=wwXIfr"
    }
  },
  {
    ep: 2,
    id: 429,
    name: "Mismagius",
    generation: 4,
    types: ["fantasma"],
    weight_kg: 4.4,
    cargado: true,
    thumbnail: "img/thumbs/mismagius.jpg",
    links: {
      youtube:   "https://youtube.com/shorts/R11Pl6oiA8A?si=yn813S9VGNjtk10S",
      tiktok:    "https://vt.tiktok.com/ZSxYYcCDM/",
      instagram: "https://www.instagram.com/reel/DXk9XOjDCKs/",
      facebook:  "https://www.facebook.com/share/v/18fd3pGWpv/?mibextid=wwXIfr"
    }
  }
];
