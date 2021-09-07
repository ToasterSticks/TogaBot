import { Message, MessageAttachment, MessageActionRow, MessageEmbed, HTTPError } from 'discord.js';
import { Args, Command, PieceContext } from '@sapphire/framework';
import { inspect } from 'util';
import createButton from '../util/buttons';
import { token } from '../config.json';
import { VM } from 'vm2';
import { execSync } from 'child_process';

export default class extends Command {
	constructor(context: PieceContext) {
		super(context, {
			name: 'eval',
			description: 'evaluate code',
			aliases: ['ev', 'eval'],
			strategyOptions: { flags: ['async'] },
		});
	}

	async run(message: Message, args: Args): Promise<void> {
		if (!message.member!.roles.cache.has('806673323463278622')) return;

		const delButton = createButton(message.author.id, 'delete');
		const row = new MessageActionRow().addComponents(delButton);
		let completed = false;

		try {
			let result;

			result = args.getFlags('async')
				? message.content.split(' ').slice(2).join(' ')
				: message.content.split(' ').slice(1).join(' ');

			// if(message.content.match(flagregex)) {
			// message.flags.push(message.content.match(flagregex)[0]);
			let evaled;

			const vm = new VM({
				eval: false,
				timeout: 2000,
				sandbox: {
					Discord: require('discord.js'),
					fetch: require('node-fetch'),
					message,
					args,
				},
			});

			const isSandboxed = message.author.id !== '320546614857170945';
			const runAsync = args.getFlags('async');

			if (isSandboxed) {
				message.client.token = null;

				setTimeout(() => !completed && execSync('pm2 restart 0'), 3000);

				if (runAsync) evaled = await vm.run('(async () => {' + result + '})()');
				else evaled = await vm.run(result);
			
				message.client.token = token;
			} else {
				if (runAsync) evaled = await eval('(async () => {' + result + '})()');
				else evaled = await eval(result);
			}

			if (typeof evaled != 'string') evaled = inspect(evaled, { depth: 0 });

			if (`\`\`\`js\n${evaled}\`\`\``.length < 2000) {
				await message.channel.send({ content: `\`\`\`js\n${evaled}\`\`\``, components: [row] });
			}
			else {
				const file = new MessageAttachment(Buffer.from(`${evaled}`), 'eval.js');

				await message.channel.send({
					content:
						'the result of eval was over 2000 characters so it has been converted to a file',
					files: [file],
					components: [row],
				});
			}

			completed = true;
		}
		catch (err) {
			message.client.token = token;

			const result = message.content.split(' ').slice(1).join(' ');

			const embed = new MessageEmbed()
				.setTitle('there was an error')
				.setDescription('```' + result + '```' + '\n ```code errored```\n' + '```' + err + '```');

			await message.channel.send({ embeds: [embed], components: [row] });
			

			if (!(err instanceof HTTPError)) console.log(err);

			completed = true;
		}
	}
}
