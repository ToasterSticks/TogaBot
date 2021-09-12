import { Message, Formatters, MessageButton, ButtonInteraction } from 'discord.js';
import { Args, Command, PieceContext } from '@sapphire/framework';

export default class extends Command {
	constructor(context: PieceContext) {
		super(context, {
			name: 'votekick',
			description: 'Vote to kick someone annoying',
		});
	}

	async run(message: Message, args: Args) {
		if (!message.member!.roles.cache.has('806673323463278622')) return message.reply('Hahaha, imagine being a pleb!');

		const member = await args.pick('member').catch(() => null);

		if (!member) return message.channel.send('You need to provide a member, you dumbass!');

		const baseMessage = `Kick ${Formatters.bold(member.user.tag)} (${Formatters.inlineCode(
			member.id,
		)})?`;

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

			if (member.kickable) {
				await member.kick();

				msg.edit(`L, ${Formatters.bold(member.user.tag)} was kicked.`);
			}
			else {
				msg.edit('I dont have permissions to kick this user, you fool.');
			}

			collector.stop();
		});

		collector.on('end', () => void msg.delete());
	}
}
