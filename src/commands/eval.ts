import { Message, MessageAttachment, MessageActionRow, MessageEmbed, HTTPError } from 'discord.js';
import { Args, Command, PieceContext } from '@sapphire/framework';
import { inspect } from 'util';
import createButton from '../util/buttons';
import { token } from '../config.json';
import { VM } from 'vm2';

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
		const delButton = createButton(message.author.id, 'delete');
		const row = new MessageActionRow().addComponents(delButton);

		try {
			let result;

			result = args.getFlags('async')
				? message.content.split(' ').slice(2).join(' ')
				: message.content.split(' ').slice(1).join(' ');

			// if(message.content.match(flagregex)) {
			// message.flags.push(message.content.match(flagregex)[0]);
			let evaled;

			message.client.token = null;

			const vm = new VM({
				eval: false,
				timeout: 5000,
				sandbox: {
					Discord: require('discord.js'),
					fetch: require('node-fetch'),
					message,
					args,
				},
			});

			if (args.getFlags('async')) {
				evaled = await vm.run('(async () => {' + result + '})()');
			}
			else {
				evaled = await vm.run(result);
			}

			message.client.token = token;

			if (typeof evaled != 'string') evaled = inspect(evaled, { depth: 0 });

			if (`\`\`\`js\n${evaled}\`\`\``.length < 2000) {
				message.channel.send({ content: `\`\`\`js\n${evaled}\`\`\``, components: [row] });
			}
			else {
				const file = new MessageAttachment(Buffer.from(`${evaled}`), 'eval.js');

				message.channel.send({
					content:
							'the result of eval was over 2000 characters so it has been converted to a file',
					files: [file],
					components: [row],
				});
			}
			// }
		}
		catch (err) {
			message.client.token = token;

			const result = message.content.split(' ').slice(1).join(' ');

			const embed = new MessageEmbed()
				.setTitle('there was an error')
				.setDescription('```' + result + '```' + '\n ```code errored```\n' + '```' + err + '```');

			message.channel.send({ embeds: [embed], components: [row] });

			if (!(err instanceof HTTPError)) console.log(err);

			return;
		}
	}
}
