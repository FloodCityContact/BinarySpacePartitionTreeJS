/* 
 * 
 * A simple binary space partition tree based on an octree. Enjoy !
 * 
 * NEXT, We will doooooo, an MIT license
 * 
 * Copyright (c) 2020 Flood City Games, LLC

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 * 
 */
/* global THREE */

BinarySpacePartition = function (geometry, onLoadComplete, onProgress) {
    var OVERSIZED_LINE_THRESHOLD = 20; // ERROR DETECTION
    var FACE_LIMIT_PER_NODE = 100;
    var treeBB;
    var root;
    var nodesSplit = 0;
    var BSPNode = function () {
        this.bb = undefined;
        this.children = undefined;
        this.faces = [];
        this.faceLookup = [];
        this.isBranch = function () {
            return this.children;
        };
        this.containsFace = function (face) {
            return face.vertTriangle.intersectsBox(this.bb);
        };
        this.addFace = function (face) {
            if (!this.faceLookup[face.lookupKey]) {
                this.faceLookup[face.lookupKey] = true;
                this.faces.push(face);
                return true;
            }
            return false;
        };
        this.createOrphanFaces = function () {
            var orphans = this.faces;
            this.faces = [];
            this.faceLookup = [];
            return orphans;
        };
    };
    function createNode(centerPoint, size) {
        var newNode = new BSPNode();
        newNode.bb = new THREE.Box3().setFromCenterAndSize(centerPoint, size);
        return newNode;
    }
    function splitNode(node) {
        var tV1 = new THREE.Vector3(), tV2 = new THREE.Vector3(), tV3 = new THREE.Vector3();
        node.children = [];
        var childSize = node.bb.getSize(tV1);
        childSize.x /= 2;
        childSize.y /= 2;
        childSize.z /= 2;
        var nodeCenter = node.bb.getCenter(tV2);
        var max = node.bb.max;
        var min = node.bb.min;
        for (var i = 0; i < 8; i++) {
            var childNode = new BSPNode();
            switch (i) {
                case 0:
                    tV3.x = min.x;
                    tV3.y = min.y;
                    tV3.z = min.z;
                    break;
                case 1:
                    tV3.x = min.x;
                    tV3.y = min.y;
                    tV3.z = max.z;
                    break;
                case 2:
                    tV3.x = max.x;
                    tV3.y = min.y;
                    tV3.z = max.z;
                    break;
                case 3:
                    tV3.x = max.x;
                    tV3.y = min.y;
                    tV3.z = min.z;
                    break;
                case 4:
                    tV3.x = min.x;
                    tV3.y = max.y;
                    tV3.z = min.z;
                    break;
                case 5:
                    tV3.x = min.x;
                    tV3.y = max.y;
                    tV3.z = max.z;
                    break;
                case 6:
                    tV3.x = max.x;
                    tV3.y = max.y;
                    tV3.z = max.z;
                    break;
                case 7:
                    tV3.x = max.x;
                    tV3.y = max.y;
                    tV3.z = min.z;
                    break;
            }
            childNode.bb = new THREE.Box3();
            childNode.bb.expandByPoint(nodeCenter);
            childNode.bb.expandByPoint(tV3);
            node.children.push(childNode);
        }
    }
    function add(node, face) {
        if (node.containsFace(face) && node.faces.length > FACE_LIMIT_PER_NODE) {
            // split node
            splitNode(node);
            nodesSplit++;
            // add back orphans
            var orphanFaces = node.createOrphanFaces();
            for (var i = 0; i < orphanFaces.length; i++) {
                add(node, orphanFaces[i]);
            }
            // call add on the node that just split
            add(node, face);
        } else if (node.containsFace(face)) {
            if (!node.isBranch()) {
                node.addFace(face);
            } else {
                // recurse on children
                for (var j = 0; j < node.children.length; j++) {
                    if (node.children[j].containsFace(face)) {
                        add(node.children[j], face);
                    }
                }
            }
        }
    }
    function searchHelper(node, searchNode, results) {
        var isHit = node.bb.intersectsBox(searchNode.bb);
        var hasFaces = node.faces.length > 0;
        if (isHit && hasFaces) {
            results.push(node);
        } else if (isHit && node.children) {
            for (var i = 0; i < node.children.length; i++) {
                searchHelper(node.children[i], searchNode, results);
            }
        }
        return results;
    }
    function search(searchNode) {
        var results = [];
        searchHelper(root, searchNode, results);
        return results;
    }
    function allNodesHelper(node, results) {
        results.push(node);
        if (node.children) {
            for (var i = 0; i < node.children.length; i++) {
                allNodesHelper(node.children[i], results);
            }
        }
    }
    function allNodes() {
        var results = [];
        allNodesHelper(root, results);
        return results;
    }
    function startAsyncInit() {
        treeBB = new THREE.Box3(geometry.vertices[0], geometry.vertices[1]);
        for (var i = 0; i < geometry.vertices.length; i++) {
            treeBB = treeBB.expandByPoint(geometry.vertices[i]);
        }
        root = createNode(treeBB.getCenter(new THREE.Vector3()), treeBB.getSize(new THREE.Vector3()));
        asyncLoader(0);
    }

    function completeAsyncInit() {
        /*
         console.log("treeBounds", treeBB);
         console.log("facesInserted", facesInserted);
         console.log("nodesSplit", nodesSplit);
         console.log("maxDepth", maxDepth);
         console.log("maxFaceListSize", maxFaceListSize);
         console.log("maxFaceListLocation", maxFaceListLocation.bb);
         console.log("maxFaceListLocation vertex ranges", maxFaceListvertexRanges);
         */
        onLoadComplete();
    }

    var tLine1 = new THREE.Line3();
    var tLine2 = new THREE.Line3();
    var tLine3 = new THREE.Line3();
    function bigLineTestPassed(triangle) {
        tLine1.start.copy(triangle.a);
        tLine1.end.copy(triangle.b);
        tLine2.start.copy(triangle.b);
        tLine2.end.copy(triangle.c);
        tLine3.start.copy(triangle.c);
        tLine3.end.copy(triangle.a);
        if (tLine1.distance() > OVERSIZED_LINE_THRESHOLD || tLine2.distance() > OVERSIZED_LINE_THRESHOLD || tLine3.distance() > OVERSIZED_LINE_THRESHOLD) {
            return false;
        }
        return true;
    }

    function asyncLoader(i) {
        var end = i + Math.ceil(geometry.faces.length / 20);
        for (; i < end && i < geometry.faces.length; i++) {
            var face = geometry.faces[i];
            face.lookupKey = face.a + "_" + face.b + "_" + face.c;
            face.vertTriangle = new THREE.Triangle(
                    geometry.vertices[face.a],
                    geometry.vertices[face.b],
                    geometry.vertices[face.c]);
            if (bigLineTestPassed(face.vertTriangle)) {
                add(root, face);
            } else {
                // NOTE: this code is used for non-optimilal blender files that
                // export bad data sometimes
                console.log("INFO: Skipping big line");
            }
        }
        if (i >= geometry.faces.length) {
            completeAsyncInit();
            return;
        }
        onProgress({
            loaded: i,
            total: geometry.faces.length
        });
        setTimeout(function () {
            asyncLoader(i);
        }, 10);
    }

    startAsyncInit();

    this.search = search;
    this.createNode = createNode;
    this.splitNode = splitNode;
    this.allNodes = allNodes;
};


