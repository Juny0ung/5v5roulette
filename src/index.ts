import './localization';
import { Roulette } from './roulette';
import options from './options';
import { registerServiceWorker } from './registerServiceWorker';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { TeamSetting, setTeamNodes, importStr } from './teamsetting/teamsetting';


registerServiceWorker();

const teamSettingsEl = document.getElementById('team-settings');
if (teamSettingsEl) {
  ReactDOM.createRoot(teamSettingsEl).render(React.createElement(TeamSetting));
}

// eslint-disable-next-line
(window as any).teamSetting = {
  /** setNodes(['Alice', 'Bob', ...]) — updates node count and names on the coordinate plane */
  setNodes: (names: string[]) => setTeamNodes(names),
  importStr: () => importStr(),
};

const roulette = new Roulette();

// eslint-disable-next-line
(window as any).roulette = roulette;
// eslint-disable-next-line
(window as any).options = options;
