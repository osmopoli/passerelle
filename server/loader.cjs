'use strict'

/*
|--------------------------------------------------------------------------
| Passenger (cPanel / HODI) startup file
|--------------------------------------------------------------------------
|
| Passenger charge le fichier de démarrage en CommonJS alors qu'AdonisJS 6
| est ESM : on délègue donc au serveur compilé via un import dynamique.
|
*/
import('./bin/server.js').catch((error) => {
  console.error(error)
  process.exit(1)
})
