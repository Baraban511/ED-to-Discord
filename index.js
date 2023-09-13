const axios = require('axios');
const { token, CHANNEL_ID, identifiant, motdepasse } = require('./config.json');
const { Client, Events, GatewayIntentBits, EmbedBuilder, ActivityType } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.once(Events.ClientReady, c => {
  console.log(`Prêt ! Connecté avec ${c.user.tag}`);
  client.user.setActivity('votre emploi du temps', { type: ActivityType.Watching });
  client.user.setStatus('online');
  CONNEXION();
});


async function CONNEXION() {

  var send = "data=" + JSON.stringify({
    identifiant,
    motdepasse
  })
  axios({
    method: 'post',
    url: 'https://api.ecoledirecte.com/v3/login.awp',
    headers: { 'Content-Type': 'text/plain', 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    data: send,
  }).then(response => {
    var token = response.data.token;
    var id = response.data.data.accounts[0].id;
    EDT(token, id);
  });
}
async function EDT(token, id) {
  const TODAY = new Date()
  const DAY = TODAY.getDate();
  const MONTH = TODAY.getMonth() + 1;
  const YEAR = TODAY.getFullYear();
  var DATE_DEBUT = YEAR + "-" + MONTH + "-" + DAY;

  var DATE_FIN = YEAR + 1 + "-" + MONTH + 1 + "-" + DAY + 1;
  var DATE = "data=" + JSON.stringify({ DATE_DEBUT, DATE_FIN })
  axios({
    method: 'post',
    url: 'https://api.ecoledirecte.com/v3/E/' + id + '/emploidutemps.awp?verbe=get',
    headers: { 'Content-Type': 'text/plain', 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'x-token': token },
    data: DATE,
  }).then(response => {

    var COURS = response.data.data;
    const LENGHT = response.data.data.length;
    var SENT = 0;

    //Fonction de tri
    COURS = JSON.parse(JSON.stringify(COURS), (key, value) => {
      if (key == "start_date" || key == "end_date") {
        return new Date(value);
      } else {
        return value;
      }
    });
    COURS = COURS.sort((a, b) => a.start_date - b.start_date);

    if (COURS.length === 0) {
      var channel = client.channels.cache.get(CHANNEL_ID);
      const COURS_EMBED = new EmbedBuilder()
        .setTitle("Bonne nouvelle !")
        .setAuthor({ name: 'Emploi du temps', iconURL: 'https://cdn.discordapp.com/avatars/1107328790931181689/8936542da2ec67f0c034c6d0b6935309.png' })
        .setURL('https://ecoledirecte.com')
        .addFields(
          { name: "Pas de cours aujourd'hui. Profitez bien !", value: '\u200B' }
        )
        .setTimestamp()
        .setFooter({ text: 'Made by Barab', iconURL: 'https://cdn.discordapp.com/avatars/768517258262741024/dd87fc7b956cfb5b2d024c340e570fb5.png' });

      channel.send({ embeds: [COURS_EMBED] }).then(() => {
        console.log("Send terminé");
        process.exit(0);
      });
    }

    else {
      while (SENT < LENGHT) {
        var channel = client.channels.cache.get(CHANNEL_ID);
        if (COURS[SENT].isAnnule == true) {
          COURS[SENT].isAnnule = ":red_circle: Le cours est annulé";
          COURS[SENT].color = "#FF0000";
        }
        else {
          COURS[SENT].isAnnule = ":green_circle: Le cours est maintenu";
        }
        const COURS_EMBED = new EmbedBuilder()
          .setColor(COURS[SENT].color)
          .setTitle(COURS[SENT].text)
          .setAuthor({ name: 'Emploi du temps', iconURL: 'https://cdn.discordapp.com/avatars/1107328790931181689/8936542da2ec67f0c034c6d0b6935309.png' })
          .setURL('https://ecoledirecte.com')
          .addFields(
            { name: `Avec ${COURS[SENT].prof} dans ${COURS[SENT].salle} de <t:${Date.parse(COURS[SENT].start_date) / 1000}:t> à <t:${Date.parse(COURS[SENT].end_date) / 1000}:t>`, value: '\u200B' },
            { name: COURS[SENT].isAnnule, value: '\u200B' }
          )
          .setTimestamp()
          .setFooter({ text: 'Made by Barab', iconURL: 'https://cdn.discordapp.com/avatars/768517258262741024/dd87fc7b956cfb5b2d024c340e570fb5.png' });

        channel.send({ embeds: [COURS_EMBED] });
        console.log("Send n° " + SENT);
        SENT++;
        if (SENT == LENGHT) {
          console.log("Send terminé");
          process.exit(0);
        }
      }
    }
  })
}
client.login(token)