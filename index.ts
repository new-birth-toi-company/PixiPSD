/**!
 * @module PixiPSD
 *
 * @version v0.0.1
 * @author Toi Company Studio Animation&Technology department
 * @description PSD Loader for PixiJS.
 * @see https://github.com/new-birth-toi-company/PixiPSD/
 * @license MIT
 */

import { Psd, Layer, readPsd } from "ag-psd";
import { Container, Graphics, Mesh, MeshGeometry, Text, Texture } from "pixi.js";

type blendMode_map_type = {
    "pass through": "inherit",
    "normal": "normal",
    "dissolve": "normal",
    "darken": "darken",
    "multiply": "multiply",
    "color burn": "color-burn",
    "linear burn": "linear-burn",
    "darker color": "normal",
    "lighten": "lighten",
    "screen": "screen",
    "color dodge": "color-dodge",
    "linear dodge": "linear-dodge",
    "lighter color": "normal",
    "overlay": "overlay",
    "soft light": "soft-light",
    "hard light": "hard-light",
    "vivid light": "vivid-light",
    "linear light": "linear-light",
    "pin light": "pin-light",
    "hard mix": "hard-mix",
    "difference": "difference",
    "exclusion": "exclusion",
    "subtract": "subtract",
    "divide": "divide",
    "hue": "normal",
    "saturation": "saturation",
    "color": "color",
    "luminosity": "luminosity"
}

const blendMode_map: blendMode_map_type = {
    "pass through": "inherit",
    "normal": "normal",
    "dissolve": "normal",
    "darken": "darken",
    "multiply": "multiply",
    "color burn": "color-burn",
    "linear burn": "linear-burn",
    "darker color": "normal",
    "lighten": "lighten",
    "screen": "screen",
    "color dodge": "color-dodge",
    "linear dodge": "linear-dodge",
    "lighter color": "normal",
    "overlay": "overlay",
    "soft light": "soft-light",
    "hard light": "hard-light",
    "vivid light": "vivid-light",
    "linear light": "linear-light",
    "pin light": "pin-light",
    "hard mix": "hard-mix",
    "difference": "difference",
    "exclusion": "exclusion",
    "subtract": "subtract",
    "divide": "divide",
    "hue": "normal",
    "saturation": "saturation",
    "color": "color",
    "luminosity": "luminosity"
}

export class Observable<T> {
    private _value: T;
    onChange?: ((input: T) => void) | null;

    constructor(initialValue: T, onChange?: (input: T) => void) {
        this._value = initialValue;
        this.onChange = onChange;
    }

    get value(): T {
        return this._value;
    }

    set value(newValue: T) {
        if (this._value !== newValue) {
            this._value = newValue;
            if (this.onChange) {
                this.onChange(newValue);
            }
        }
    }
}

export class Point {
    _x: Observable<number>;
    _y: Observable<number>;
    onChange?: (input: Point) => void;

    constructor(
        x: number = 0,
        y: number = 0,
        onChange?: (input: Point) => void,
    ) {
        this._x = new Observable(x);
        this._y = new Observable(y);
        this.onChange = onChange;

        this._x.onChange = () => this.updatePoint()
        this._y.onChange = () => this.updatePoint()

        this.xy = [x, y];
    }

    private updatePoint(): void {
        if (this.onChange) {
            this.onChange(this);
        }
    }

    get x(): number {
        return this._x.value;
    }

    set x(value: number) {
        this._x.value = value;
    }

    get y(): number {
        return this._y.value;
    }
    set y(value: number) {
        this._y.value = value;
    }

    get xy(): [number, number] {
        return [this._x.value, this._y.value];
    }

    set xy(value: [number, number]) {
        this._x.value = value[0];
        this._y.value = value[1];
    }
}

class NodeGeometryData {
    vertices: Float32Array;
    uvs: Float32Array;
    indices: Uint32Array;
    geometry: MeshGeometry;

    constructor(geometry: MeshGeometry) {
        this.vertices = new Float32Array([]);
        this.uvs = new Float32Array([]);
        this.indices = new Uint32Array([]);
        this.geometry = geometry;
    }

    add_vertex(x: number, y: number) {
        this.vertices.set([x, y], this.vertices.length);
        this.indices.set([this.vertices.length / 2 - 1], this.indices.length);

        this.update()
    }

    remove_vertex(index: number) {
        const verticesArray = Array.from(this.vertices);
        verticesArray.splice(index * 2, 2);
        this.vertices = new Float32Array(verticesArray);

        const indicesArray = Array.from(this.indices);
        indicesArray.splice(index, 1);
        this.indices = new Uint32Array(indicesArray);

        this.update()
    }

    edit_vertex(index: number, x: number, y: number) {
        this.vertices[index * 2] = x;
        this.vertices[index * 2 + 1] = y;

        this.update()
    }

    update() {
        this.geometry.positions = this.vertices;
        this.geometry.uvs = this.uvs;
        this.geometry.indices = this.indices;
    }
}

export class Node {
    original: Psd | Layer;
    display: Mesh | Container;
    private _type: "PSD" | "Group" | "Layer";
    private _name: string = "";
    geometry?: MeshGeometry;
    geometryData?: NodeGeometryData;
    children: Node[] = [];
    position: Point;
    private _parent?: Node;

    constructor(node: Psd | Layer, parent?: Node) {
        this.original = node;
        this.name = node.name ?? "Unnamed Node";


        if (node.children?.length) {
            this._type = "Group";

            this.display = new Container();

            node.children.forEach((child) => {
                const child_node = new Node(child, this)
                this.children.push(child_node)
                this.display.addChild(child_node.display)
            });
        } else {
            this._type = "Layer";
            if (node.text) {
                this.display = new Text({
                    text: node.text.text,
                    style: {
                        fill: node.text.style?.fillColor as { "r": number, "g": number, "b": number, "a": number } | undefined,
                        fontFamily: node.text.style?.font?.name,
                        fontSize: node.text.style?.fontSize,
                        stroke: {
                            color: node.text.style?.strokeColor as { "r": number, "g": number, "b": number, "a": number } | undefined,
                        }
                    }
                })
            } else {
                const geometry = this.geometry = new MeshGeometry({

                })

                this.geometryData = new NodeGeometryData(geometry);

                this.display = new Mesh({
                    geometry
                });

                this.init_texture();
            }
        }

        const top = 'top' in node ? node.top : 0;
        const left = 'left' in node ? node.left : 0;

        this.position = new Point(
            top,
            left,
            (point) => {
                this.display.position.x = point.x;
                this.display.position.y = point.y;
            }
        );

        const clipping = 'clipping' in node ? node.clipping : null;

        if (clipping) {
            if (parent?.children[parent.children.length - 1]?.display) {
                this.display.mask = parent?.children[parent.children.length - 1]?.display;
            }
        }

        const blendMode = 'blendMode' in node ? node.blendMode : null;

        if (blendMode) {
            this.display.blendMode = blendMode_map[blendMode];
        }

        this._parent = parent;
    }

    async init_texture() {
        if (this.display instanceof Mesh && this.original.imageData) {
            const value = this.original.imageData.data;
            const texture = Texture.from({
                "resource": value.buffer,
                "height": this.original.imageData.height,
                "width": this.original.imageData.width,
            })
            this.display.texture = texture;
        }
    }

    async show_vertex() {
        if (this.display instanceof Mesh) {
            const geometry = this.display.geometry as MeshGeometry;
            const vertices = geometry.getBuffer("aVertexPosition").data as Float32Array;
            const indices = geometry.getIndex().data as Uint16Array;
            const vertex = new Container();

            const g = new Graphics();

            g.x = this.display.x;
            g.y = this.display.y;

            g.clear();
            const x = vertices[0];
            const y = vertices[1];
            g.moveTo(x, y);

            for (let i = 0; i < vertices.length; i += 2) {
                g.lineTo(vertices[i], vertices[i + 1]);
                g.stroke({ width: 2, color: 0xffc2c2 });
            }

            for (let i = 0; i < vertices.length; i += 2) {
                g.circle(vertices[i], vertices[i + 1], 10);
                g.fill({ color: 0xff0022 });
                g.stroke({ width: 2, color: 0xffc2c2 });
            }
            this.display.addChild(vertex);
        }
    }

    get name(): string {
        return this._name;
    }
    set name(x: string) {
        this._name = x;
        this.display.label = x;
        this.original.name = x;
    }

    set knockout(x: boolean) {
        console.warn("Knockout is not supported by PixiJS. This property will be ignored.");
        this.original.knockout = x;
    }
    get knockout(): boolean {
        return this.original.knockout ?? false;
    }

    get opacity(): number {
        return this.display.alpha;
    }
    set opacity(x: number) {
        this.display.alpha = x;
        this.original.fillOpacity = x;
    }
    get zIndex(): number {
        return this.display.zIndex;
    }
    set zIndex(x: number) {
        this.display.zIndex = x;
    }
    get parent(): Node | null {
        return this._parent ?? null;
    }
    set parent(parent: Node) {
        this.display.parent = parent.display;
        this._parent = parent;
    }
    get visible(): boolean {
        return this.display.visible;
    }
    set visible(x: boolean) {
        this.display.visible = x;
        if ("hidden" in this.original) {
            this.original.hidden = !x;
        } else {
            this.original.layerMaskAsGlobalMask
        }
    }
    get type(): "PSD" | "Group" | "Layer" {
        return this._type;
    }

    set type(x: "Group" | "Layer") {
        this._type = x;
        this.children = [];
        if (x === "Group") {
            this.display = new Container();

            this.original.children?.forEach((child) => {
                const child_node = new Node(child, this)
                this.children.push(child_node)
                this.display.addChild(child_node.display)
            });
        } else {
            const geometry = this.geometry = new MeshGeometry({

            })

            this.display = new Mesh({
                geometry
            });

            if (this._parent) {
                this._parent.display.addChild(this.display);
            }

            this.init_texture();
        }
    }
}

export class PixiPSD<T extends Node = Node> extends Node {
    override children!: T[];
    override get type(): "PSD" {
        return "PSD";
    }

    constructor(buffer: ArrayBuffer) {
        const original = readPsd(buffer);
        super(original)
    }

    static async from(url: string): Promise<PixiPSD> {
        const response = await fetch(url)
        if (response.body) {
            const result = await response.body.getReader().read()
            if (result.value) {
                return new PixiPSD(result.value.buffer);
            }
        }
        throw new Error("Failed to load PSD file.");
    }
}
