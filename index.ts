/**!
 * @module PixiPSD
 *
 * @version v0.0.1
 * @author Toi Company Studio Animation&Technology department
 * @description PSD Loader for PixiJS.
 * @see https://github.com/new-birth-toi-company/PixiPSD/
 * @license MIT
 */

import { Psd, Layer, readPsd, BlendMode as PSDBlendMode, LayerMaskData } from "ag-psd";
import { flushCompileCache } from "module";
import {
    Container,
    Mesh,
    MeshGeometry,
    ObservablePoint,
    Texture,
    PointData,
    DestroyOptions,
    BLEND_MODES as PixiBlendMode
} from "pixi.js";

type blendMode_map_type = {
    [key in PSDBlendMode]: PixiBlendMode;
};

const blendMode_map: blendMode_map_type = {
    "pass through": "inherit",
    normal: "normal",
    dissolve: "normal",
    darken: "darken",
    multiply: "multiply",
    "color burn": "color-burn",
    "linear burn": "linear-burn",
    "darker color": "normal",
    lighten: "lighten",
    screen: "screen",
    "color dodge": "color-dodge",
    "linear dodge": "linear-dodge",
    "lighter color": "normal",
    overlay: "overlay",
    "soft light": "soft-light",
    "hard light": "hard-light",
    "vivid light": "vivid-light",
    "linear light": "linear-light",
    "pin light": "pin-light",
    "hard mix": "hard-mix",
    difference: "difference",
    exclusion: "exclusion",
    subtract: "subtract",
    divide: "divide",
    hue: "normal",
    saturation: "saturation",
    color: "color",
    luminosity: "luminosity",
};

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

    constructor(x: number = 0, y: number = 0, onChange?: (input: Point) => void) {
        this._x = new Observable(0);
        this._y = new Observable(0);
        this.onChange = onChange;

        this._x.onChange = () => this.updatePoint();
        this._y.onChange = () => this.updatePoint();

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

export class Vessel {
    private readonly original: Psd | Layer;
    display: Container;
    _parent: Vessel | null = null;
    _mask: Vessel | null = null;
    _clipping: boolean = false;

    constructor(node: Psd | Layer | LayerMaskData, parent?: Vessel) {
        this.original = node;
        this.display = new Container();

        if (parent) {
            this.parent = parent;
        }

        if ("top" in node || "left" in node) {
            this.position = { x: node.top ?? 0, y: node.left ?? 0 };
        } else {
            this.position = { x: 0, y: 0 };
        }
        if ("fillOpacity" in node) {
            this.opacity = node.fillOpacity ?? 1;
        }
        if ("hidden" in node) {
            this.visible = !node.hidden;
        }
        if ("blendMode" in node) {
            this.blendMode = node.blendMode ?? "normal";
        }
        if ("referencePoint" in node) {
            this.pivot = node.referencePoint ?? { x: 0, y: 0 };
        }
        if ("mask" in node && node.mask) {
            this.mask = new Contents(node.mask)
        }
        if ("clipping" in node && node.clipping) {
            this.clipping = node.clipping;
        }
    }

    get clipping(): boolean {
        return this.clipping;
    }
    set clipping(value: boolean) {
        if (this.parent && value) {
            const now_index = this.parent.children.indexOf(this)
            if (now_index !== -1 && now_index !== 0) {
                this.mask = this.parent.children[now_index - 1];
            }
        }

    }

    get children(): (Vessel | Contents)[] {
        if (this.original.children) {
            return this.original.children.map(child => {
                if (child.children) {
                    return new Vessel(child, this);
                } else {
                    return new Contents(child);
                }
            });
        }
        return [];
    }

    async destroy(option: DestroyOptions) {
        this.display.destroy(option);
    }

    set mask(value: Vessel | null) {
        this._mask = value;
        this.display.mask = value?.display ?? null;
    }
    get mask(): Vessel | null {
        return this._mask;
    }

    set blendMode(value: PSDBlendMode | PixiBlendMode) {
        let result: PixiBlendMode
        if (value in blendMode_map) {
            result = blendMode_map[value as PSDBlendMode];
        } else {
            result = value as PixiBlendMode;
        }

        this.display.blendMode = result;
    }
    get blendMode(): PixiBlendMode {
        return this.display.blendMode;
    }

    get position(): ObservablePoint {
        return this.display.position;
    }
    set position(value: PointData) {
        this.display.position = value;
    }

    get pivot(): ObservablePoint {
        return this.display.pivot;
    }
    set pivot(value: PointData) {
        this.display.pivot = value;
    }

    get opacity(): number {
        return this.display.alpha;
    }
    set opacity(value: number) {
        this.display.alpha = value;
    }

    get zIndex(): number {
        return this.display.zIndex;
    }
    set zIndex(value: number) {
        this.display.zIndex = value;
    }

    get parent(): Vessel | null {
        return this.parent ?? null;
    }
    set parent(value: Vessel | null) {
        this.parent = value;
        if (value) {
            this.display.parent = value.display;
        }
    }

    get visible(): boolean {
        return this.display.visible;
    }
    set visible(value: boolean) {
        this.display.visible = value;
    }

    get type(): "PSD" | "Group" | "Layer" {
        return "Group"
    }
}

export class GeometryData {
    geometry: MeshGeometry;
    positions: PointData[];
    uvs: { u: number, v: number }[];
    indice: number[];

    constructor(geometry: MeshGeometry) {
        this.geometry = geometry;
        this.positions = [];
        this.uvs = [];
        this.indice = [];
    }

    addVertex(x: number, y: number, u: number, v: number): number {
        this.positions.push({ x, y });
        this.uvs.push({ u, v });
        this.updateArrays();
        return this.positions.length - 1;
    }

    addTriangle(index0: number, index1: number, index2: number) {
        this.indice.push(index0, index1, index2);
    }

    setVertex(index: number, x: number, y: number): void {
        if (index >= 0 && index < this.positions.length) {
            this.positions[index].x = x;
            this.positions[index].y = y;
        }
    }

    setUV(index: number, u: number, v: number): void {
        if (index >= 0 && index < this.uvs.length) {
            this.uvs[index].u = u;
            this.uvs[index].v = v;
            this.updateArrays();
        }
    }

    removeVertex(index: number): void {
        if (index >= 0 && index < this.positions.length) {
            this.positions.splice(index, 1);
            this.uvs.splice(index, 1);

            // インデックス配列を更新
            this.indice = this.indice.filter(idx => idx !== index).map(idx => idx > index ? idx - 1 : idx);

            this.updateArrays();
        }
    }

    updateArrays() {
        this.geometry.positions = new Float32Array(this.positions.flatMap(v => [v.x, v.y]));
        this.geometry.uvs = new Float32Array(this.uvs.flatMap(uv => [uv.u, uv.v]));
        this.geometry.indices = new Uint32Array(this.indice);
    }
}

export class Contents extends Vessel {
    display: Mesh;
    geometoryData?: GeometryData;
    constructor(node: Psd | Layer | LayerMaskData, parent?: Vessel) {
        super(node, parent);
        const geometry = new MeshGeometry({});

        this.geometoryData = new GeometryData(geometry);

        if (!node.imageData) {
            throw new Error("No Image");
        }
        const value = node.imageData.data;
        const texture = Texture.from({
            resource: value.buffer,
            height: node.imageData.height,
            width: node.imageData.width,
        });

        this.display = new Mesh({
            geometry,
            texture
        });
    }
}

export class PixiPSD extends Vessel {
    override get type(): "PSD" {
        return "PSD";
    }

    constructor(buffer: ArrayBuffer) {
        const original = readPsd(buffer);
        super(original);
    }

    static async from(url: string): Promise<PixiPSD> {
        const response = await fetch(url);
        if (response.body) {
            const result = await response.body.getReader().read();
            if (result.value) {
                return new PixiPSD(result.value.buffer);
            }
        }
        throw new Error("Failed to load PSD file.");
    }
}
