'use strict'
String.prototype.clr = function (hexColor) { return `<font color='#${hexColor}'>${this}</font>` };

const SettingsUI = require('tera-mod-ui').Settings;
const Quests = require("./quests.json");

module.exports = function AutoGuildquest(mod) {

	let myQuestId = 0,
		status = 2,
		progress = 0,
		clr = 0,
		entered = false,
		hold = false,
		daily = 0,
		weekly = 0
	  
	mod.game.me.on('change_zone', (zone, quick) => {
		if (mod.settings.battleground.includes(zone)) {
			hold = true
		} else if (hold && myQuestId !== 0) {
			hold = false
			completeQuest()
			CompleteExtra()
		}
	});

//Hook
	mod.game.on('enter_game', () => {daily = weekly = 0})
	mod.hookOnce('S_AVAILABLE_EVENT_MATCHING_LIST', 1, event => {daily = event.unk4weekly = event.unk6})
	mod.hook('C_RETURN_TO_LOBBY', 'raw', () => {  entered = false;});
	mod.hook('S_COMPLETE_EVENT_MATCHING_QUEST', 1, (event) => {
		daily++
		weekly++
		if (mod.settings.Vanguard) {
			myQuestId = event.id
			if (!hold) setTimeout(completeQuest,1000+ Math.random()*250);
		}
	});
	mod.hook('S_UPDATE_GUILD_QUEST_STATUS', 1, (event) => {
		if (mod.settings.GQuest) {
			if (event.targets[0].completed == event.targets[0].total) {
				setTimeout(()=>{
				mod.send('C_REQUEST_FINISH_GUILD_QUEST', 1, {quest: event.quest})
				}, 2000 + Math.random()*1000)
				setTimeout(() => {
				mod.send('C_REQUEST_START_GUILD_QUEST', 1, {questId: event.quest})
				}, 4000 + Math.random()*1000)
			}
		}
	})

	function completeQuest() {
		mod.send('C_COMPLETE_DAILY_EVENT', 1, {id: myQuestId})	
		setTimeout(() => {mod.send('C_COMPLETE_EXTRA_EVENT', 1, {type: 0})
		}, 500+ Math.random()*250)
		setTimeout(() => {mod.send('C_COMPLETE_EXTRA_EVENT', 1, {type: 1})
		}, 1000+ Math.random()*250)
		myQuestId = 0
		if(mod.settings.VLog) report() 
		
	}; 
	function report() {
		if(daily < 16) mod.command.message(niceName + 'Daily Vanguard Requests completed: ' + daily)
		else mod.command.message(niceName + 'You have completed all 16 Vanguard Requests today.')
	};
	function sendMessage(msg) { mod.command.message(msg) }
	let ui = null;
	if (global.TeraProxy.GUIMode) {
		ui = new SettingsUI(mod, require('./settings_structure'), mod.settings, { alwaysOnTop: true, width: 550, height: 232 });
		ui.on('update', settings => { mod.settings = settings; });

		this.destructor = () => {
			if (ui) {
				ui.close();
				ui = null;
			}
		};
	}
//Commands
	mod.command.add('auto', {
		'vg': () => {
			mod.settings.Vanguard = !mod.settings.Vanguard
			sendMessage("Auto-Vanguard: " + (mod.settings.Vanguard ? "On" : "Off"));
		},
		'gq': () => {
			mod.settings.GQuest = !mod.settings.GQuest
			sendMessage("Auto-Guildquest: " + (mod.settings.GQuest ? "On" : "Off"));
		},
		'vlog': () => {
			mod.settings.VLog = !mod.settings.VLog
			sendMessage("Vanguard-Logger: " + (mod.settings.VLog ? "On" : "Off"));
		},
		'ui': () => {
			ui.show();
		},
		'$default': () => {
			sendMessage(`Invalid argument! Use the commands below...`),
			sendMessage(`auto ui | Shows the settings UI window`),
			sendMessage(`auto gq | Toggles Auto-Guildquest setting`),
			sendMessage(`auto vg | Toggles Auto-Vanguard setting`),
			sendMessage(`auto vlog | Shows your daily Vanguards`);
		}
	});
}