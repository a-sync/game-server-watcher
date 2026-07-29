# <img src="https://github.com/a-sync/game-server-watcher/assets/14183614/66a8ffa8-c547-4f9c-b312-4c855da80c20" width="40" align="left"> Game Server Watcher
Un bot sencillo para discord/telegram/slack que puede alojarse en un servicio gratuito para monitorear tus servidores de juegos y jugadores con estilo. 😎  

# Sobre el Proyecto
Los objetivos principales de este repositorio son:
 1. Crear un servicio/bot (simple pero capaz) para monitorear servidores de juegos
    1. Obtener información del servidor mediante gamedig y la API de steam (_ej.: nombre del servidor, mapa, jugadores, etc._)
    1. Retransmitir información del servidor en tiempo real a varios canales vía APIs (_ej.: discord, telegram, slack etc._)
 1. Debe poder alojarse en un servicio gratuito (_el objetivo actual es fly.io (node.js 20)_)
 1. Añadir progresivamente más funciones basadas en los comentarios de la comunidad a través de [discord <img src="https://cdn.discordapp.com/icons/935911764023996527/1b791c9533f24a6bc23dbf5b2c134436.png?size=20" width="20" align="absmiddle" title="ACME Corp." alt="">](https://discord.gg/4tsbftsGJz) y [github :octocat:](https://github.com/a-sync/game-server-watcher/discussions/new?category=ideas-requests)

# Capturas de Pantalla
<img src="https://user-images.githubusercontent.com/14183614/162092529-e1645b44-2650-4893-8123-7ba187b1f51c.png" height="520"> <img src="https://user-images.githubusercontent.com/14183614/162092488-f28bd60c-88bf-4b1e-a31e-d7dca51d8c28.png" height="520"> <img src="https://github.com/a-sync/game-server-watcher/assets/14183614/0461ad76-bb13-468c-a7b3-437d6a3cea63" height="520"> <img src="https://github.com/a-sync/game-server-watcher/assets/14183614/ee0ef0de-83bc-42ae-8f64-62f481f6ba8f" height="520"> 

# Estado del Proyecto
El código en sí es estable y se prueba/despliega continuamente desde la rama master.  

El proyecto se encuentra en una etapa madura. Se añaden nuevas opciones de personalización y funciones según se soliciten.  

### Posibles funciones y opciones de configuración para añadir en el futuro
 * ~~lista de jugadores opcional~~
   * campos personalizables (tiempo, nombre, ping, puntuación)
   * campo y orden configurables para ordenar
   * longitud máxima para nombres de jugadores y número de jugadores
 * ~~gráfico opcional~~
 * campos de embed personalizados para discord/slack
 * ~~desplazamiento de zona horaria configurable para el eje X del gráfico~~
 * actualizar mediante reacción
 * jugadores vigilados (notificar cuando un jugador vigilado entre/salga del servidor)
 * detectar cuando el servidor se desconecte, notificar cuando el número de jugadores supere un umbral
 * comandos del bot (reinicializar mensaje, limpieza, iniciar/detener, publicar estado del servidor, configurar)
 * más integraciones: ~~telegram~~, ~~slack~~, ms teams, twillio (email, sms)
 * ~~interfaz web para gestionar y configurar los servidores y bots~~
 * poner información personalizada en el nombre del canal o estado del bot (indicador de estado online, número de jugadores, mapa)
 * flujos de trabajo de github action para desplegar en otros proveedores de nube (aws, linode, atlantic, vultr, pikapods, okteto, ibm cloud etc.)
 * soporte para bases de datos SQL, JSON o almacenamiento de objetos (postgres, redis etc.)
 * ejecutar como función serverless sin estado (aws lambda, azure function, heroku, vercel, fly.io machines etc.)
 * ~~lanzamiento de egg para pterodactyl/pelican~~

# Primeros Pasos
Estas instrucciones te permitirán obtener una copia del proyecto y ponerlo en marcha en tu máquina local para fines de desarrollo y prueba. Consulta [despliegue](#deployment) para notas sobre cómo desplegar el proyecto en un sistema en vivo.  

## Requisitos
[node.js](https://nodejs.org/) _(versión 16.20.0 o posterior)_  

## Obtener el código fuente
Este proyecto está [alojado en github](https://github.com/a-sync/game-server-watcher). Puedes clonar este proyecto directamente usando este comando:

```
git clone git@github.com:a-sync/game-server-watcher.git
```

La fuente más reciente también se puede descargar como un [archivo zip](https://github.com/a-sync/game-server-watcher/archive/refs/heads/master.zip).  

## Instalación
Usa npm o yarn para instalar/actualizar todas las dependencias:
```
npm i
```

Construye los artefactos desde la fuente:
```
npm run build
```

## Uso
Inicia los artefactos construidos:
```
npm start
```

Construye, inicia y reinicia automáticamente ante cambios en la fuente:
```
npm run dev
```

## Ajustes
El comportamiento del servicio de monitoreo se puede configurar mediante variables de entorno (env vars).  
También se admite un archivo `.env` ([dotenv](https://www.npmjs.com/package/dotenv)), para ver los valores disponibles y los predeterminados, consulta el archivo [.env.example](./.env.example).  
Para comenzar, simplemente puedes renombrar el archivo `.env.example` a `.env`.  

Consulta la wiki sobre cómo obtener tokens para:
 * [steam](https://github.com/a-sync/game-server-watcher/wiki/Steam-Web-API-key)
 * [discord](https://github.com/a-sync/game-server-watcher/wiki/Discord-bot-token)
 * [telegram](https://github.com/a-sync/game-server-watcher/wiki/Telegram-bot-token)
 * [slack](https://github.com/a-sync/game-server-watcher/wiki/Slack-bot-token)

## Gestión del servicio
**GSW Control Panel** es una interfaz web que te permite configurar y controlar la instancia de Game Server Watcher.  
La aplicación web se sirve en `http://localhost:8080` por defecto.  
_¡Asegúrate de configurar la variable de entorno `SECRET`!_  

### Configuración
Actualiza el archivo de configuración y reinicia el servicio.

### Limpiar datos (Flush)
#### Limpiar datos de servidores de juegos
Elimina los datos del historial de población. (configurado por la opción del servidor _Graph history time span_)

#### Limpiar datos de discord
Si el mensaje original creado por el bot es eliminado, es posible que necesites limpiar los datos del bot para reinicializar el mensaje.  
_El bot no tiene funcionalidad de limpieza automática, los mensajes sobrantes deben eliminarse manualmente._

#### Limpiar datos de telegram
Si el mensaje original creado por el bot es eliminado, debes limpiar los datos del bot para reinicializar el mensaje.  
_El bot no tiene funcionalidad de limpieza automática, los mensajes sobrantes deben eliminarse manualmente._

#### Limpiar datos de slack
Si el mensaje original creado por el bot es eliminado, debes limpiar los datos del bot para reinicializar el mensaje.  
_El bot no tiene funcionalidad de limpieza automática, los mensajes sobrantes deben eliminarse manualmente._

# Despliegue
Consulta la página de la wiki para obtener instrucciones detalladas sobre [cómo configurar una instancia gratuita de nube con autodespliegue en fly.io](https://github.com/a-sync/game-server-watcher/wiki/Free-hosting-via-fly.io).  
Los eggs más recientes de Pterodactyl y Pelican siempre se pueden encontrar aquí: [🥚](./eggs/).  
Las imágenes de contenedor preconstruidas se pueden descargar desde el registro de contenedores de github: `docker pull ghcr.io/a-sync/game-server-watcher`  
<p align="center">
  <!--<a href="https://app.koyeb.com/deploy?type=git&repository=github.com/a-sync/game-server-watcher&branch=master&name=gsw"><img src="https://www.koyeb.com/static/images/deploy/button.svg" height="32" alt="Deploy to Koyeb"></a>//TODO: support ephemeral storage-->
  <!--<a href="https://heroku.com/deploy?template=https%3A%2F%2Fgithub.com%2Fa-sync%2Fgame-server-watcher"><img src="https://www.herokucdn.com/deploy/button.svg" height="32" alt="Deploy to Heroku"></a>//TODO: support ephemeral storage-->
  <a href="https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fa-sync%2Fgame-server-watcher%2Fmaster%2Fazuredeploy.json"><img src="https://aka.ms/deploytoazurebutton" height="32" alt="Deploy to Azure"></a>
  <a href="https://deploy.cloud.run?git_repo=https%3A%2F%2Fgithub.com%2Fa-sync%2Fgame-server-watcher"><img src="https://deploy.cloud.run/button.svg" height="32" alt="Run on Google Cloud"></a>
  <a href="https://cloud.digitalocean.com/apps/new?repo=https%3A%2F%2Fgithub.com%2Fa-sync%2Fgame-server-watcher%2Ftree%2Fmaster"><img src="https://www.deploytodo.com/do-btn-blue.svg" height="32" alt="Deploy to DigitalOcean"></a>
  <!--<a href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fa-sync%2Fgame-server-watcher&env=SECRET"><img src="https://vercel.com/button" height="32" alt="Deploy with Vercel"></a>//TODO: support runnig as serverless function-->
  <!--<a href="https://stackblitz.com/fork/github/a-sync/game-server-watcher"><img src="https://developer.stackblitz.com/img/open_in_stackblitz.svg" height="32" alt="Open in StackBlitz"></a>-->
</p>

## Alojamiento vía Docker Compose
Asegúrate de configurar las variables de entorno en [docker-compose.yml](./docker-compose.yml#L13).  
```
docker-compose up
```

## Alojamiento vía runtime de NodeJS
¡Asegúrate de que se cumplan todos los [requisitos](#requirements)!  

### Construir artefactos
```
npm i
npm run build
```

### Archivos mínimos requeridos en el host
Copia el archivo `./package.json` y las carpetas `./public/` y `./dist/` junto con sus contenidos a tu carpeta de despliegue.
 
### Instalar dependencias de producción en el host
Navega a la carpeta de despliegue y ejecuta el siguiente comando:
```
npm i --only=prod
```
_Si no puedes instalar dependencias en el host, realiza una instalación local y copia la carpeta `./node_modules/` al host._

### Configuración del servicio
Crea variables de entorno para habilitar las funciones requeridas y personalizar el servicio.  
1. Asegúrate de que el servicio pueda escribir en la ruta de almacenamiento de datos. (configurado por la variable `DATA_PATH`, defecto: `./data/`)  
2. Asegúrate de crear un secreto de administrador único. (configurado por la variable `SECRET`, defecto: `secret`)

### Ejecución
Ejecuta el programa desde la carpeta de despliegue:
```
node ./dist/server.js
```

# Cómo obtener ayuda
* Consulta la [wiki](https://github.com/a-sync/game-server-watcher/wiki)
* Haz una [pregunta](https://github.com/a-sync/game-server-watcher/discussions/new?category=q-a)
* Únete al [discord](https://discord.gg/4tsbftsGJz) de soporte / pruebas

# Lectura adicional
* [lista de juegos soportados por gamedig](https://github.com/gamedig/node-gamedig/blob/master/GAMES_LIST.md)
* [steamDB](https://steamdb.info/apps/)
* [documentación de la API web de steam](https://steamapi.xpaw.me/#IGameServersService/GetServerList)
* [documentación de la API de discord v10](https://discord.js.org/#/docs/discord.js/14.7.1/class/EmbedBuilder)
* [documentación de la API de telegram](https://core.telegram.org/bots/api#editmessagetext)
* [documentación de la API de slack](https://api.slack.com/apis)
    * [referencia de block kit](https://api.slack.com/reference/block-kit#reference)
* [documentación de json-editor](https://github.com/json-editor/json-editor#json-schema-support)
    * [demos de json-editor](https://pmk65.github.io/jedemov2/dist/demo.html)
* [referencia de bootstrap 4](https://www.w3schools.com/bootstrap4/bootstrap_ref_all_classes.asp)
* [documentación de mustache](https://github.com/janl/mustache.js#templates)
* [documentación de pterodactyl](https://pterodactyl.io/community/config/eggs/creating_a_custom_egg.html)
    * [fork de documentación comunitaria](https://quintenqvd0.github.io/pterodactyl-documentation/docs/eggs/egg/)

# Contribuir
¡Las contribuciones públicas son bienvenidas!  
Puedes crear un [nuevo issue](https://github.com/a-sync/game-server-watcher/issues/new) para errores, o no dudes en abrir un [pull request](https://github.com/a-sync/game-server-watcher/pulls) para cualquiera de tus cambios o funciones en progreso.

# Licencia
Este proyecto está licenciado bajo la [Licencia AGPL](./LICENSE.md) por defecto para uso público. Las empresas u organizaciones que busquen una licencia comercial, por favor contacten a gsw@devs.space.

# Autores
Consulta la lista de [contribuyentes](https://github.com/a-sync/game-server-watcher/contributors) que participaron en este proyecto.

# Agradecimientos
Este proyecto fue inspirado por (la repentina desaparición del) bot "_Game Status#5371_" y su creador [Ramzi Saheb](https://github.com/Ramzi-Sah) en discord.  

El icono de GSW fue tomado de _Marvel’s Voices: Indigenous Voices #1_ "_The Watcher_" por [Jeffrey Veregge](https://www.jeffreyveregge.com).  

Los fondos fueron tomados de [purple nebulas](https://opengameart.org/content/seamless-space-backgrounds) por [Screaming Brain Studios](https://screamingbrainstudios.com) e [imgur](https://imgur.com).  

Todas las demás librerías y dependencias se enumeran en el _archivo package.json (sección dependencies/devDependencies)_ y en el _archivo index.html (sección head)_.  

## Proyectos similares
* https://github.com/soulkobk/DiscordBot_GameStatus
* https://github.com/Douile/discord-gamestatus
* https://github.com/Ramzi-Sah/game-status-discordbot
* https://github.com/Ramzi-Sah/game-status-discordbot-selfhosted  
* https://github.com/msniveau/discord-statusbot
* https://github.com/kevinkjt2000/bowser
* https://github.com/negrifelipe/ServerStatusBot
* https://gitlab.com/lxndr/gswatcher
* https://github.com/Unity-Technologies/qstat
* https://github.com/GiyoMoon/steam-server-query
* https://github.com/Fabricio-191/valve-server-query
* https://github.com/sbuggay/srcds-info-proxy
* https://github.com/DiscordGSM/DiscordGSM
* https://github.com/EndBug/game-tracker
* https://github.com/fasko-web/discord-gameserver-bots
* https://github.com/FlorianSW/discord-player-count-bot
* https://github.com/Destarianon/FawxGameDigBot
* https://github.com/patriksh/gameserver-bot
