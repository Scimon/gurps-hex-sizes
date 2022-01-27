import { injectConfig } from './injectConfig.js'
import { borderData } from './token-border-config.js'
import { findVertexSnapPoint, findMovementToken, getEvenSnappingFlag, getAltSnappingFlag, getAltOrientationFlag, getCenterOffset } from './helpers.js'

//load in the hex token config's html template
Hooks.once('init', async function(){
	loadTemplates(['modules/gurps-hex-sizes/templates/hex-token-config.html'])
})

Hooks.on('renderTokenConfig', async (tokenConfig, html)  =>{
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
		tokenConfig.object
	);
	const posTab = html.find('.tab[data-tab="gurps-hex-sizes"]');
    const borderSize = tokenConfig.object.getFlag("gurps-hex-sizes", "borderSize") || 0
    let data = {
        sizeOptions: borderData.map( (d) => { return { "key": d.key, "label": `${d.name} (${d.height}x${d.width})` }} ),
        borderSize: borderSize,
    };

	const insertHTML = await renderTemplate('modules/gurps-hex-sizes/templates/hex-token-config.html', data);
	posTab.append(insertHTML);

});

//Add the listener for flipping the orientation of a hex token
Hooks.once("ready", async function(){
    //expose helper methods for other modules to use
    CONFIG.hexSizeSupport = {};
    CONFIG.hexSizeSupport.findVertexSnapPoint = findVertexSnapPoint
    CONFIG.hexSizeSupport.findMovementToken = findMovementToken
    CONFIG.hexSizeSupport.getAltSnappingFlag = getAltSnappingFlag
    CONFIG.hexSizeSupport.getAltOrientationFlag = getAltOrientationFlag
    CONFIG.hexSizeSupport.getCenterOffset = getCenterOffset
    CONFIG.hexSizeSupport.getEvenSnappingFlag = getEvenSnappingFlag


    document.addEventListener("keydown", function(event){
        const key = game.keyboard.getKey(event);
        if(event.shiftKey){
            if(key == "R" || key == "r"){
                let tokens = canvas.tokens.placeables.filter(o => o._controlled); 
                for(let token of canvas.tokens.controlled){
                    let alternate = token.document.getFlag("gurps-hex-sizes","alternateOrientation") || false;
                    token.document.setFlag("gurps-hex-sizes","alternateOrientation", !alternate);
                }
            }
        }
    });
})
