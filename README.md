# BinarySpacePartitionTreeJS

Binary Space Partiion Tree for Javascript

Come check us out at:

www.floodcitygames.com

## Getting Started

Just include this Javascript file in your project and you can do collision detection on a client's browser.

### Prerequisites

Install ThreeJS at https://threejs.org

Uses a THREE.Geometry object. Must convert if not a standard geometry. See https://threejs.org/docs/index.html#api/en/core/Geometry and https://threejs.org/docs/index.html#api/en/core/Geometry.fromBufferGeometry.

Example Usage:

```

var staticGeometry = yourThreeJsGeometry;
var raySearchDebugOn = false;
var bspTree = new BinarySpacePartition(staticGeometry, function () {
            console.log("loading complete");
        }, function () {
            console.log("progress ....");
        });

function rayCollidesWithBSP(startPoint, endPoint) {
	var searchBox = bspTree.createNode(new THREE.Vector3(), sizeVec);
	searchBox.bb = new THREE.Box3();
	searchBox.bb.expandByPoint(startPoint);
	searchBox.bb.expandByPoint(endPoint);
	searchBox.bb.expandByVector(new THREE.Vector3(0.1, 0.1, 0.1)); // magic, based on scale
	if (raySearchDebugOn) {
		var origin = startPoint.clone();
		var direction = endPoint.clone().sub(origin).normalize();
		var far = startPoint.distanceTo(endPoint) + 1;
		var helper = new THREE.Box3Helper(searchBox.bb, 0xffffff * Math.random());
		scene.add(helper);
		var arrowHelper = new THREE.ArrowHelper(direction, origin, far, 0xffffff * Math.random());
		scene.add(arrowHelper);
	}
	var results = bspTree.search(searchBox);
	return checkCollision(results, searchBox);
}
	
function collidesWithBSP(position) {
	var searchBox = bspTree.createNode(position.clone(), sizeVec);
	var results = bspTree.search(searchBox);
	return checkCollision(results, searchBox);
}

function checkCollision(results, searchBox) {
	for (var i = 0; i < results.length; i++) {
		var node = results[i];
		for (var j = 0; j < node.faces.length; j++) {
			var face = node.faces[j];
			if (debugTriangles) {
				showTriangle(face.vertTriangle);
			}
			if (face.vertTriangle.intersectsBox(searchBox.bb)) {
				return true;
			}
		}
	}
	return false;
}

var startPoint = new THREE.Vector3(x1, y1, z1);
var endPoint = new THREE.Vector3(x2, y2, z2);
var randomPoint = new THREE.Vector3(x3, y3, z3);

if(rayCollidesWithBSP(startPoint,endPoint){
	conosle.log("collision at ray from ", startPoint, " to ", endPoint);
}

if(collidesWithBSP(randomPoint){
	conosle.log("collision at random point ", randomPoint);
}

```
	
## Authors

contact@floodcitygames.com

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* Inspired by https://wiki.cs.umd.edu/cmsc420/view/PM_Quadtree