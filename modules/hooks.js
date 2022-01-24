import { HexTokenConfig } from './hex-token-config.js'
import { findVertexSnapPoint, findMovementToken, getEvenSnappingFlag, getAltSnappingFlag, getAltOrientationFlag, getCenterOffset } from './helpers.js'

//load in the hex token config's html template
Hooks.once('init', async function(){
	loadTemplates(['modules/gurps-hex-sizes/templates/hex-token-config.html'])
})

//Add the hex config button to the token hud
Hooks.on("renderTokenHUD", async (app, html, token) => {
		var configButton = html.find('[data-action="config"]').first();
		if (configButton === null) {
			configButton = html.find('.config');
		}
		configButton.after($(`
		<div class="control-icon config" id="hexConfig">
           	<img src="modules/gurps-hex-sizes/assets/hexIcon.svg" style="display: block; margin-left: auto; margin-right: auto;"/>
        </div>`));
        let button = html.find("#hexConfig")
        button.click(function() {
        	let foo = new HexTokenConfig(app.object, app).render(true);
        });
        
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
