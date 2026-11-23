// Vuelca el contenido de la plataforma a JSON para generar los impresos con la misma fuente.
import { RETOS, LIEBERT, ASISTENTE, urlImpresa } from '../js/contenido/cartas.js';
import { config } from '../js/config.js';
const con = (xs) => xs.map(x => ({ ...x, url: urlImpresa(x.codigo) }));
console.log(JSON.stringify({ urlPublica: config.urlPublica, retos: con(RETOS), liebert: con(LIEBERT), asistente: con(ASISTENTE) }, null, 1));
