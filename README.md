# GURPS Hex Sizes
A module to support creatures from Size Modifier 0-6 for GURPS. Based on https://github.com/Ourobor/Hex-Size-Support

Currently supports three shapes more coming.
* Size Mod 0 (1x1 hex mostly for testing)
* Size Mod 0 Sleek (2x1 hex)
* Size Mod 1 Sleek (3x1 hex)
* Size Mod 1 Boxy (2x1 hex)
* Size Mod 2 Sleek (4x1 hex)
* Size Mod 2 Boxy (3x3 Hex)
* Size Mod 2 Upright (1x2 Hex) 

Rotation is done around the head hex as per the GURPS rules.

Note that for some sizes (Size 2 Upright for example) the rotation hex is added to the front of the figure.

## Token Sizing

The module allows for two options for token sizing. Either you can set the token size as normal 
and it will place your token in the centre of the hex shape. 
Otherwise you can select the 'Override Image Size' option, this will resize your image based on
the size required for the image. This works with images that have the same ratio as the
expected grid size. 
