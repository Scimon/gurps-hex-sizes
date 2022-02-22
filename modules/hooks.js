import { injectConfig } from './injectConfig.js'
import { borderData } from './token-border-config.js'
//import { findVertexSnapPoint, findMovementToken, getEvenSnappingFlag, getAltSnappingFlag, getAltOrientationFlag, getCenterOffset } from './helpers.js'

//load in the hex token config's html template
Hooks.once('init', async function(){
	loadTemplates(['modules/gurps-hex-sizes/templates/hex-token-config.html'])
})

Hooks.on('renderTokenConfig', async (tokenConfig, html)  =>{
    console.log(tokenConfig);
	injectConfig.inject(
		tokenConfig,
		html,
		{
			moduleId: "gurps-hex-sizes",
			tab: {
				name: "gurps-hex-sizes",
				label: "Hex Size",
				icon: "fas fa-chess-board",
			},
		},
		tokenConfig.token
	);
	const posTab = html.find('.tab[data-tab="gurps-hex-sizes"]');
    const borderSize = tokenConfig.token.getFlag("gurps-hex-sizes", "borderSize") || 0
    const overrideSize = ( tokenConfig.token.getFlag('gurps-hex-sizes', "overrideSize") || 0 ) ? "checked" : ""
    let data = {
        sizeOptions: borderData.map( (d) => { return { "key": d.key, "label": `${d.name} (${d.height}x${d.width})` }} ),
        borderSize: borderSize,
        overrideSize: overrideSize,
    };

	const insertHTML = await renderTemplate('modules/gurps-hex-sizes/templates/hex-token-config.html', data);
	posTab.append(insertHTML);

});
