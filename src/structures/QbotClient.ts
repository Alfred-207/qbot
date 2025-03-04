import { Client } from 'discord.js';
import { BotConfig, CommandExport } from './types';
import { Command } from './Command';
import { config } from '../config';
import { readdirSync, writeFileSync } from 'fs';
import { discordClient } from '../main';
import { qbotLaunchTextDisplay, welcomeText, startedText, securityText, getListeningText } from '../handlers/locale';
import { getLogChannels } from '../handlers/handleLogging';
require('dotenv').config();

class QbotClient extends Client {
    config: BotConfig;
    commands: any[];

    constructor() {
        super({
            intents: [
                'GUILDS',
                'GUILD_MESSAGES',
                'GUILD_MEMBERS',
                'GUILD_MESSAGE_REACTIONS',
            ]
        })
        this.config = config;
        this.on('ready', () => {
            console.log(qbotLaunchTextDisplay);
            console.log(welcomeText);
            if(this.application.botPublic) return console.log(securityText);
            console.log(startedText);
            console.log(getListeningText(process.env.PORT || 3001));
            this.loadCommands();
            getLogChannels();

            if(config.activities.enabled) {
                
                let pickRandom = () => {
                    setInterval(() => {
                      this.user?.setPresence({
                        activities: [
                          config.activities.options[Math.floor(Math.random() * (config.activities.options.length - 0) + 0)],
                        ],
                        status: config.status,
                      });
                    }, 60000);
                  };
                  
                  pickRandom()


                
            }

        });
    }

    /**
     * Load all commands into the commands object of QbotClient.
     */
    loadCommands() {
        const rawModules = readdirSync('./src/commands');
        const loadPromise = new Promise((resolve, reject) => {
            let commands: Command[] = [];
            rawModules.forEach(async (module, moduleIndex) => {
                const rawCommands = readdirSync(`./src/commands/${module}`);
                rawCommands.forEach(async (cmdName, cmdIndex) => {
                    const { default: command }: CommandExport = await import(`../commands/${module}/${cmdName.replace('.ts', '')}`);
                    commands.push(command);
                    if(moduleIndex === rawModules.length - 1 && cmdIndex === rawCommands.length - 1) resolve(commands);
                });
            }); 
        });
        loadPromise.then(async (commands: Command[]) => {
            const slashCommands = commands.map((cmd: any) => new cmd().generateAPICommand());
            const currentCommands = require('../resources/commands.json');
            if(JSON.stringify(currentCommands) !== JSON.stringify(slashCommands)) {
                writeFileSync('./src/resources/commands.json', JSON.stringify(slashCommands), 'utf-8');
                discordClient.application.commands.set(slashCommands);
            }
            this.commands = commands;
        });
    }
}

export { QbotClient };
