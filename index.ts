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
import { Container, Mesh, MeshGeometry, Texture } from "pixi.js";
class Observable<T> {
    private _value: T;
    observer?: ((input: T) => void) | null;

    constructor(initialValue: T, observer?: (input: T) => void) {
        this._value = initialValue;
        this.observer = observer;
    }

    get value(): T {
        return this._value;
    }

    set value(newValue: T) {
        if (this._value !== newValue) {
            this._value = newValue;
            if (this.observer) {
                this.observer(newValue);
            }
        }
    }
}

class Point {
    _x: Observable<number>;
    _y: Observable<number>;
    observer?: (input: Point) => void;

    constructor(
        x: number = 0,
        y: number = 0,
        observer?: (input: Point) => void,
    ) {
        this._x = new Observable(x);
        this._y = new Observable(y);
        this.observer = observer;

        const wrappedObserver = (input: { x: number; y: number }) => {
            if (this.observer) {
                const tmp = new Point();
                tmp.xy = [input.x, input.y];
                this.observer(tmp);
            }
        };
        this._x.observer = (observe_x) =>
            wrappedObserver({ x: observe_x, y: this._y.value });
        this._y.observer = (observe_y) =>
            wrappedObserver({ x: this._x.value, y: observe_y });

        this.xy = [x, y];
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

export class Node {
    original: Psd | Layer;
    display: Mesh | Container;
    private _type: "PSD" | "Group" | "Layer";

    name: string;
    geometry?: MeshGeometry;
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

            const geometry = this.geometry = new MeshGeometry({

            })

            this.display = new Mesh({
                geometry
            });

            this.init_texture();
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
        )

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

    get opacity(): number {
        return this.display.alpha;
    }
    set opacity(x: number) {
        this.display.alpha = x;
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

            if(this._parent) {
                this._parent.display.addChild(this.display);
            }

            this.init_texture();
        }
    }
}

export class PixiPSD extends Node {
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
