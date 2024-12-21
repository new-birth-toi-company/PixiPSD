/**!
 * @module PixiPSD
 * 
 * @version v0.0.1
 * @author Toi Company Studio Animation&Technology department
 * @description PSD Loader for PixiJS.
 * @see https://github.com/new-birth-toi-company/PixiPSD/
 * @license MIT
 */

import Psd, { Group as PSDGroup, Layer as PSDLayer } from "@webtoon/psd";
import { NodeBase } from "@webtoon/psd/dist/classes/NodeBase";
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
        return this._x.value;
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

type Node = {
    original: NodeBase;
    display: Container;
    readonly type: "Group" | "Layer";

    name: string;
    opacity: number;
    zIndex: number;
    position: Point;
    children: Node[];
    parent: null | Group;
}

export class Layer implements Node {
    original: PSDLayer;
    display: Mesh;
    name: string;
    geometry: MeshGeometry;
    readonly type: "Layer" = "Layer";
    children: never[] = [];
    private _parent: Group;
    position: Point;

    constructor(layer: PSDLayer, parent: Group) {
        this.original = layer;
        this.name = layer.name;

        const geometry = this.geometry = new MeshGeometry({

        })

        this.display = new Mesh({
            geometry,
        });

        layer.composite().then(async (value)=>{
            const texture = Texture.from({
                "resource": value.buffer,
                "height": layer.height,
                "width": layer.width,
            })
            this.display.texture = texture;
        })

        this._parent = parent;
        this.position = new Point(
            layer.top,
            layer.left,
            (point)=>{
                this.display.position.x = point.x;
                this.display.position.y = point.y;
            }
        )
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
    get parent(): Group {
        return this._parent;
    }
    set parent(parent: Group) {
        this.display.parent = parent.display;
        this._parent = parent;
    }
}

export class Group implements Node {
    original: PSDGroup;
    display: Container;
    name: string;
    readonly type: "Group" = "Group";
    children: Node[] = [];
    private _parent: Group;
    position: Point;

    constructor(group: PSDGroup, parent: Group) {
        this.original = group;
        this.name = group.name;

        this.display = new Container();

        this._parent = parent;

    
        this.position = new Point(
            0,
            0,
            (point)=>{
                this.display.position.x = point.x;
                this.display.position.y = point.y;
            }
        )

        this.children = group.children.map((child)=>{
            if (child.type === "Group") {
                return new Group(child, this);
            }else{
                return new Layer(child, this);
            }
        });
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
    get parent(): Group {
        return this._parent;
    }
    set parent(parent: Group) {
        this.display.parent = parent.display;
        this._parent = parent;
    }
}

export class PixiPSD implements Node {
    original: Psd;
    display: Container;
    readonly type: "Group" = "Group";

    name: string;
    children: Node[] = [];
    parent: null = null;
    position: Point;

    constructor(buffer: ArrayBuffer) {
        this.original = Psd.parse(buffer);

        this.display = new Container();

        this.name = this.original.name;

        this.position = new Point(
            0,
            0,
            (point)=>{
                this.display.position.x = point.x;
                this.display.position.y = point.y;
            }
        )
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

    static async from(url: string): Promise<PixiPSD> {
        const response = await fetch(url)
        if(response.body){
            const result = await response.body.getReader().read()
            if (result.value) {
                return new PixiPSD(result.value.buffer);
            }
        }
        throw new Error("Failed to load PSD file.");
    }
}
