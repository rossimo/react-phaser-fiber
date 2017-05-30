declare namespace ReactPhaser {
    interface Node {
        x?: number
        y?: number
        key?: any
        ref?: Function
    }
    interface Line extends Node {
        endX: number,
        endY: number
        color?: number,
        width?: number,
        alpha?: number
    }
    interface Rect extends Node {
        width: number,
        height: number,
        color?: number
    }
    interface Circle extends Node {
        diameter: number,
        color?: number
    }
    interface Graphics extends Node {
        children: JSX.Element[] | JSX.Element,
        key?: number | string
    }
    interface Sprite extends Node {
        image: string
        scale?: number,
        width?: number,
        height?: number,
    }
    interface Group extends Node {
        children: JSX.Element[] | JSX.Element,
        draggable?: boolean,
        backgroundColor?: number
        onClick?: Function
        onDrag?: Function
    }
    interface Game {
        children: JSX.Element[] | JSX.Element,
        width?: number
        height?: number
        assets?: {
            type: string
            key: string
            location: string
        }[]
    }
}

declare namespace JSX {
    export interface IntrinsicElements {
        game: ReactPhaser.Game
        graphics: ReactPhaser.Graphics
        group: ReactPhaser.Group
        sprite: ReactPhaser.Sprite
        phaser_line: ReactPhaser.Line
        phaser_rect: ReactPhaser.Rect
        phaser_circle: ReactPhaser.Circle
    }
}