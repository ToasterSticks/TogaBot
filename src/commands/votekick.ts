import { Message, Formatters, MessageButton, ButtonInteraction } from 'discord.js';
import { Args, Command, PieceContext } from '@sapphire/framework';

export default class extends Command {
	constructor(context: PieceContext) {
		super(context, {
			name: 'votekick',
			aliases: ['eject'],
			description: 'Vote to kick someone annoying',
		});
	}

	async run(message: Message, args: Args) {
		if (!message.member!.roles.cache.has('806673323463278622')) return message.reply('Hahaha, imagine being a pleb!');

		const member = await args.pick('member').catch(() => null);

		if (!member) return message.channel.send('You need to provide a member, you dumbass!');

		if (member.id === message.author.id) return message.channel.send('I\'m pretty sure you wouldn\'t want to do this.');

		const baseMessage = `Is ${Formatters.bold(member.user.tag)} the impostor?`;

		const msg = await message.channel.send({
			content: baseMessage,
			components: [{
				type: 1,
				components: [
					new MessageButton().setLabel('yes.').setCustomId('yes').setStyle('DANGER'),
				],
			}],
		});

		const collector = msg.createMessageComponentCollector<ButtonInteraction>({ time: 300000, componentType: 'BUTTON' });

		collector.on('collect', async (interaction) => {
			await interaction.deferUpdate();

			if (collector.users.size !== 3) {return void interaction.editReply(`${baseMessage} ${collector.users.size}/3 votes received.`);}

			const count = Math.ceil(Math.random() * 5);
			const plural = count === 1 ? '' : 's';
			const impostorCount = `${count} impostor${plural} remain${plural}.`;

			if (member.kickable) {
				await member.kick('They were an impostor, and were ejected.').catch(() => collector.stop());

				msg.edit(`${Formatters.bold(member.user.tag)} was ejected. ${impostorCount}`);
			}
			else {
				msg.edit(`${Formatters.bold(member.user.tag)} was not an impostor. ${impostorCount}`);
			}

			collector.stop();
		});

		collector.on('end', () => void msg.edit({ components: [] }));
	}
}
