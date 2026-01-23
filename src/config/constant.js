/**
 * Program configuration object defining stage and type settings
 * TODO: Consider fixing spelling from 'chepest' to 'cheapest'
 * 
 * @typedef {Object} ProgramConfig
 * @property {string} stage - Processing stage setting ('single')
 * @property {string} type - Program type setting ('standard')
 */

const chepestProgram = {
    'stage':'single',
    'type' :'standard'
}

const stageNumber = {
    'single': 1,
    'double': 2,
    'triple': 3,
    'trial': 3,
    'instant': 4
}

const installerUrl = {
    'windows': 'https://download.mql5.com/cdn/web/wizense.global.ltd/mt5/wizenseglobal5setup.exe', 
    'android': 'https://download.mql5.com/cdn/mobile/mt5/android',
    'ios': 'https://download.mql5.com/cdn/mobile/mt5/ios',
    'mac': 'https://download.mql5.com/cdn/web/blue.whale.markets/mt5/bluewhalemarkets5setup.exe'
}
const serverDetail = 'WizenseGlobal-Demo';
export {
    chepestProgram,
    stageNumber,
    installerUrl,
    serverDetail
}