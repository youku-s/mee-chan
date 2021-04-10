import { startBot, botID } from "https://deno.land/x/discordeno/mod.ts";
import { connect } from "https://deno.land/x/redis/mod.ts";
import { configs } from "./configs.ts";
import { messages } from "./messages.ts";

const redis = await connect({
  hostname: configs.redisHost,
  port: 19147,
  password: configs.redisPass
});

function random(min: number, max: number) {
  return Math.floor(Math.random() * ( ( max + 1 ) - min ) ) + min;
}

startBot({
  token: "BOT TOKEN",
  intents: ["GUILDS", "GUILD_MESSAGES"],
  eventHandlers: {
    ready() {
      console.log("Successfully connected to gateway");
    },
    async messageCreate(message) {
      // botの発言を読み飛ばす
      if(message.author.bot){
        return;
      }
  
      const actions = [
        {
          word: "^みー$",
          func: () => { message.send("みー") }
        },
        {
          word: ".*しあわせ.*",
          func: () => { message.send("しあわせだねっ？") }
        },
        {
          word: "^(AN|an)$",
          func: () => { message.send(messages.anji[random(0, 9)]) }
        },
        {
          word: "^(TA|ta)$",
          func: () => { message.send(messages.takaramono[random(0, 9)]) }
        },
        {
          word: "^(MR|mr)$",
          func: () => { message.send(messages.mirenSisters[random(0, 9)]) }
        },
        {
          word: "^(MRE|mre)$",
          func: () => { message.send(messages.mirenEnemy[random(0, 9)]) }
        },
        {
          word: "^(MRN|mrn)$",
          func: () => { message.send(messages.mirenNeutral[random(0, 9)]) }
        },
        {
          word: "^(KI|ki)$",
          func: () => { message.send(messages.kioku[random(0, 99)]) }
        },
        {
          word: "^(KIA|kia)$",
          func: () => { message.send(messages.kioku[random(100, 199)]) }
        },
        {
          word: "^(KIB|kib)$",
          func: () => { message.send(messages.kioku[random(200, 299)]) }
        },
        {
          word: "^(KIALL|kiall)$",
          func: () => { message.send(messages.kioku[random(0, 299)]) }
        },
        {
          word: "(てーぶる)",
          func: async () => { 
            if (!message.mentions.includes(botID) && !message.content.startsWith("@みーちゃん")) {
              return;
            }
            const lines = message.content.split("\n");
            lines.shift();
            const key = lines.shift();
            if (lines[0].startsWith("https://")) {
              await fetch(lines[0]).then(res => res.text()).then(body => {
                console.log(body);
                redis.set(`mee:${key}`, body);
              })
            } else {
              await redis.set(`mee:${key}`, lines.join("\n"));
            }
            await message.send(`${key} をおぼえたよ`);
          }
        },
        {
          word: "(ふって)\\s+([^\\s]+)",
          func: async () => { 
            if (!message.mentions.includes(botID) && !message.content.startsWith("@みーちゃん")) {
              return;
            }
            const key = message.content.split(/\s+/)[2];
            const valueOpt = await redis.get(`mee:${key}`);
            const values = (valueOpt ?? "").split("\n");
            const newMessage = values[random(0, values.length - 1)];
            await message.send(newMessage);
          }
        },
        {
          word: "(bcdice)\\s+([^\\s]+)\\s+([^\\s]+)",
          func: async () => {
            const systemName = message.content.split(/\s+/)[1];
            const command = message.content.split(/\s+/)[2];
            await fetch(`https://bcdice.trpg.net//v1/diceroll?system=${systemName}&command=${command}`)
              .then(x => x.json())
              .then(data => {
                if(data.ok) {
                  message.send(data.result);
                } else {
                  message.send(`しっぱいしたよ: ${systemName} ${command}`);
                }
              })
          }
        }
      ];

      const matches = actions.filter(x => RegExp(x.word).test(message.content.trim()));
      if(matches.length === 0) { return; }
      await matches[0].func();
    }
  }
});