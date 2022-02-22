import { findVertexSnapPoint, getAltSnappingFlag, getEvenSnappingFlag, getAltOrientationFlag, getCenterOffset } from './helpers.js'
import { borderData } from './token-border-config.js'

Token.prototype.refresh = (function () {
	const cached = Token.prototype.refresh;
	return function () {
		let borderSize = this.document.getFlag("gurps-hex-sizes", "borderSize");
		let overrideSize = this.document.getFlag("gurps-hex-sizes", "overrideSize");

		let border = borderData[borderSize];

		const gridW = canvas.grid.grid.w;
		const gridH = canvas.grid.grid.h;

		//execute existing refresh function
		const p = cached.apply(this, arguments);
		
		if(border === undefined || borderSize == 0){
			return p
		}

		this.data.height = 1;
		this.data.width = 1;
		if ( overrideSize ) {
			this.icon.height = border.height * gridH;
			this.icon.width = border.width * gridW;
			this.icon.position.set(0,0);
			this.icon.anchor.set(1 / 2, 1 - (1 / (border.height * 2)));
			this.icon.position.set((this.w) /  2, (this.h) / 2);
	
		}
		this.icon.rotation = this.data.lockRotation ? 0 : Math.toRadians(this.data.rotation);
		if ( border.rotHalf ) { this.icon.rotation -= ( 30 * (Math.PI/180))}

		this.icon.alpha = this.data.hidden ? Math.min(this.data.alpha, 0.5) : this.data.alpha;

		let alwaysShowBorder = this.document.getFlag("gurps-hex-sizes", "alwaysShowBorder")

		//handle rerendering the borders for custom border offsets and resizing
		if(alwaysShowBorder == true || (borderSize != undefined /*&& borderSize != 1*/)){
			let borderColor = this._getBorderColor();


			//override null if the border is always to be shown
			if(alwaysShowBorder == true && !borderColor){
				borderColor = 0x56a2d6
			}

			if(!!borderColor){

				let columns = canvas.grid.grid.columns;

				//remap the coordinates to the grid's width/height
				let startPoints = border.border.map((p) => {
					if(columns){
						return [(gridH * p[0]), (gridW * p[1])];
					}
					else{
						return [(gridW * p[0]), (gridH * p[1])];
					}
				});

				
				//is this grid using columns?
				let alt = getAltOrientationFlag(this);

				let borderRotationOffset = this.data.rotation - 30;

				if(alt){
					borderRotationOffset += 180;
				}

			    //rotate the coordinates
			    //this is required because the rotation attribute of the border only rotates the graphics, not the hit area
			    //and the hit area is only defined by a collection of points
			    const cosTheta = Math.cos((borderRotationOffset) * 0.0174533);
			    const sinTheta = Math.sin((borderRotationOffset) * 0.0174533);

			    let rotatedPoints = startPoints.map( (point) => {
					let x1 = point[0]
					let y1 = point[1];
			    	let x = cosTheta * x1 + (-1 * sinTheta * y1);
			    	let y = sinTheta * x1 + cosTheta* y1;
			    	return [x,y]
			    })
			    
			    let shiftedPoints = rotatedPoints.map((point) => {
			    	const x = point[0] + (gridW / 2)
			    	const y = point[1] + (gridH / 2)
					return [x,y];
			    })

				
				let xyPoints = shiftedPoints;

				this.hitArea = new PIXI.Polygon(xyPoints.flat())
				
				this.border.clear()
				this.border.lineStyle(4, 0x000000, 0.8).drawPolygon(xyPoints.flat());
				this.border.lineStyle(2, borderColor || 0xFF9829, 1.0).drawPolygon(xyPoints.flat());

				//Muck around with layering to get the border on top
				if(alwaysShowBorder){
					if(this.sortableChildren == false){
						this.sortableChildren = true;
					}
					this.border.zIndex = 10;
				}
			}
		}

		return p;
	};
})();

//overwrite the left click drop handling to snap the token correctly when you release dragging the token
Token.prototype._cachedonDragLeftDrop = Token.prototype._onDragLeftDrop;
Token.prototype._onDragLeftDrop = function(event) {
	let altSnapping = getAltSnappingFlag(this)

	if(altSnapping == true){
		const clones = event.data.clones || [];
	    const {originalEvent, destination} = event.data;
		const preview = game.settings.get("core", "tokenDragPreview");

	    // Ensure the destination is within bounds
	    if ( !canvas.grid.hitArea.contains(destination.x, destination.y) ) return false;

	    // Compute the final dropped positions
	    const updates = clones.reduce((updates, c) => {
	    	// Reset vision back to the initial location
			if ( preview )  c._original.updateSource({noUpdateFog: true});

	    	// Get the snapped top-left coordinate
	    	let dest = {x: c.data.x, y: c.data.y};

	    	//only enabling snapping when shift isn't held
	    	if (!originalEvent.shiftKey || (canvas.grid.type !== CONST.GRID_TYPES.GRIDLESS)) {
		      	let evenSnapping = getEvenSnappingFlag(this);

		      	let offset = getCenterOffset(this)
		      	let snapPoint = {}
		      	if(evenSnapping == false){
				    //get coordinates of the center of the hex that this coordinate falls under
				    [snapPoint.x, snapPoint.y] = canvas.grid.getCenter(dest.x + offset.x, dest.y + offset.y);
		      	}
		      	else{  
		      		//get the coordinates of the closest vertex snap point valid for this token
					snapPoint = findVertexSnapPoint(dest.x + offset.x, dest.y + offset.y, this, canvas.grid.grid)
		      	}
		      	dest = {
				    x: snapPoint.x - offset.x,
				    y: snapPoint.y - offset.y
				}
	      	}

	      // Test collision for each moved token vs the central point of it's destination space
	      if ( !game.user.isGM ) {
	      	c._velocity = c._original._velocity;
	        let target = c.getCenter(dest.x, dest.y);
	        let collides = c.checkCollision(target);
	        if ( collides ) {
	          ui.notifications.error(game.i18n.localize("ERROR.TokenCollide"));
	          return updates
	        }
	      }

	      // Perform updates where no collision occurs
	      updates.push({_id: c._original.id, x: dest.x, y: dest.y});
	      return updates;
	    }, []);
	    return canvas.scene.updateEmbeddedDocuments("Token", updates);
	}
	else {
		this._cachedonDragLeftDrop(event);
	}
}

//Handle dealing with shifting a token, this fixes issues with using arrow keys
Token.prototype._getShiftedPositionCached = Token.prototype._getShiftedPosition;
Token.prototype._getShiftedPosition = function(dx, dy){
	//conditionally lock out arrow key movement for a token
	if(this.data.tempHexValues?.locked == true){
		return {x: this.x, y:this.y}
	}
	let altSnapping = getAltSnappingFlag(this)

	//run original code if no flag for alt-snapping
	if(!altSnapping == true){
		return this._getShiftedPositionCached(dx,dy);
	}
	else{
		let columns = canvas.grid.grid.columns;
		let [row, col] = canvas.grid.grid.getGridPositionFromPixels(this.data.x, this.data.y);

		let x = this.x;
		let y = this.y;
		
		let evenSnapping = getEvenSnappingFlag(this)

		if(columns != true){
			if(dy != 0 && dy % 2 != 0){
				//reduce the magnitude of dy by 0.5 to offset the change in dx
				if(dy > 0){
					dy -= 0.5
				}
				else if(dy > 0){
					dy += 0.5
				}
				//if we're in an even column, zig to the left
				if(col % 2 == 0){
					dx -= 0.5;
				}
				//otherwise zag to the right
				else if(col % 2 != 0){
					dx += 0.5;
				}
			}
		}
		else{
			//handle the zigzag for columns
			//we only need to offset the tile if we're changing y and the number of tiles is odd
			if(dx != 0 && dx % 2 != 0){
				//reduce the magnitude of dy by 0.5 to offset the change in dx
				if(dx > 0){
					dx -= 0.5
				}
				else if(dx > 0){
					dx += 0.5
				}

				//if we're in an even column, zig to the left
				if(row % 2 == 0){
					dy -= 0.5;
				}
				//otherwise zag to the right
				else if(row % 2 != 0){
					dy += 0.5;
				}
			}
		}

		x += dx * canvas.grid.grid.w
		y += dy * canvas.grid.grid.h
			
		let dest = {x:x, y:y}

	    let targetCenter = this.getCenter(dest.x, dest.y);
	    let collide = this.checkCollision(targetCenter);

		let offset = getCenterOffset(this)
      	let snapPoint = {}
      	if(evenSnapping == false){
		    //get coordinates of the center of the hex that this coordinate falls under
		    [snapPoint.x, snapPoint.y] = canvas.grid.getCenter(dest.x + offset.x, dest.y + offset.y);
      	}
      	else{  
      		//get the coordinates of the closest vertex snap point valid for this token
			snapPoint = findVertexSnapPoint(dest.x + offset.x, dest.y + offset.y, this, canvas.grid.grid)
      	}
      	dest = {
		    x: snapPoint.x - offset.x,
		    y: snapPoint.y - offset.y
		}

	    return collide ? {x: this.data.x, y: this.data.y} : {x: dest.x, y: dest.y};
	}
}

// We extend the definition of clone to also include cloning for temp values
// because otherwise they aren't duplicated any time the object is cloned(like for drag and drop movement)
Token.prototype.cloneCached = Token.prototype.clone;
Token.prototype.clone = function() {
	let clone = this.cloneCached();
	
	//copy temp values into the clone
	if(this.data.tempHexValues != undefined){
		clone.data.tempHexValues = {}
		Object.assign(clone.data.tempHexValues, this.data.tempHexValues)
	}

	return clone;
}
