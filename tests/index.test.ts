import { describe, it } from "mocha";
import assert from 'assert';

import { Psd, Layer } from "ag-psd";
import { Container, Text, Mesh, MeshGeometry } from "pixi.js";
import { Node } from "../index";

describe("Node constructor", () => {
    it("should initialize a Node with type 'Group' when children are present", () => {
        const mockPsd: Psd = {
            children: [{ name: "Child Layer" }] as Layer[],
            name: "Group Layer",
            width: 100,
            height: 100
        };

        const node = new Node(mockPsd);

        assert.equal(node.type,"Group");

        assert.ok(node.display instanceof Container);
        assert.equal(node.children.length,1);
        assert.equal(node.children[0].name,"Child Layer");
    });

    it("should initialize a Node with type 'Layer' when no children are present", () => {
        const mockLayer: Layer = {
            name: "Single Layer"
        };

        const node = new Node(mockLayer);

        assert.equal(node.type,"Layer");
        assert.ok(node.display instanceof Mesh);
        assert.equal(node.children.length,0);
    });

    it("should initialize a Node with a Text display when text is present", () => {
        const mockLayer: Layer = {
            name: "Text Layer",
            text: {
                text: "Hello World",
                style: {
                    fillColor: { r: 255, g: 255, b: 255, a: 1 },
                    font: { name: "Arial" },
                    fontSize: 24,
                    strokeColor: { r: 0, g: 0, b: 0, a: 1 }
                }
            }
        };

        const node = new Node(mockLayer);

        assert.equal(node.type,"Layer");
        assert.ok(node.display instanceof Text);
        assert.equal((node.display as Text).text,"Hello World");
    });

    it("should set the position of the Node correctly", () => {
        const mockLayer: Layer = {
            name: "Position Layer",
            top: 100,
            left: 200
        };

        const node = new Node(mockLayer);

        assert.equal(node.position.x,100);
        assert.equal(node.position.y,200);
        assert.equal(node.display.position.x,100);
        assert.equal(node.display.position.y,200);
    });

    it("should set the blend mode of the Node correctly", () => {
        const mockLayer: Layer = {
            name: "Blend Mode Layer",
            blendMode: "multiply"
        };

        const node = new Node(mockLayer);

        assert.equal(node.display.blendMode,"multiply");
    });

    it("should set the mask of the Node correctly when clipping is true", () => {
        const parentLayer: Layer = {
            name: "Parent Layer",
            children: [{ name: "Child Layer" }] as Layer[]
        };

        const parentNode = new Node(parentLayer);
        const childNode = parentNode.children[0];

        const mockLayer: Layer = {
            name: "Clipping Layer",
            clipping: true
        };

        const node = new Node(mockLayer, parentNode);

        assert.equal(node.display.mask,childNode.display);
    });
});