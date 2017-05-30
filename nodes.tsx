import 'pixi.js'
import 'p2'
import 'phaser'
import * as _ from 'lodash'

export interface Diff {
    removed: string[]
    added: { [key: string]: any }
    modified: { [key: string]: any }
}

export class Instance {
    object(): any {

    }

    finalizeInitialChildren(props: any) {
        this.update(props);
    }

    update(props: any, diff?: Diff) {
    }

    appendInitialChild(child: Instance) {
    }

    appendChild(child: Instance) {
    }

    removeChild(child: Instance) {
    }

    insertBefore(child: Instance, beforeChild: Instance) {
    }

    prepareUpdate(oldProps: any, newProps: any): Diff {
        var diff: Diff = {
            removed: [],
            added: {},
            modified: {}
        }

        for (var oldProp in oldProps) {
            if (!newProps.hasOwnProperty(oldProp)) {
                diff.removed.push(oldProp);
            }
        }

        for (var newProp in newProps) {
            if (!oldProps.hasOwnProperty(newProp)) {
                diff.added[newProp] = newProps[newProp];
            }
        }

        for (var prop in oldProps) {
            if (newProps.hasOwnProperty(prop) && oldProps[prop] !== newProps[prop]) {
                diff.modified[prop] = newProps[prop];
            }
        }

        delete diff.modified.children;

        if (_.size(diff.added) > 0 || _.size(diff.modified) > 0 || diff.removed.length > 0) {
            return diff;
        } else {
            return null;
        }
    }
}

class GraphicNodeInstance<P> extends Instance {
    props: P;
    graphics: Graphics;

    update(props: P) {
        this.props = props;

        if (this.graphics) {
            this.graphics.draw();
        }
    }

    setGraphics(graphics: Graphics) {
        this.graphics = graphics;
    }

    draw() {

    }
}

export class Sprite extends Instance {
    sprite: Phaser.Sprite;
    phaser: Phaser.Game;

    constructor(props: ReactPhaser.Sprite, host: Phaser.Game) {
        super();

        this.phaser = host;
        this.sprite = host.add.sprite(props.x || 0, props.y || 0, props.image);
    }

    object(): Phaser.Sprite {
        return this.sprite;
    }

    type(): string {
        return 'sprite';
    }

    update(props: ReactPhaser.Sprite) {
        this.sprite.x = props.x || 0;
        this.sprite.y = props.y || 0;

        this.sprite.scale = new Phaser.Point(props.scale || 1, props.scale || 1);

        if (props.width) {
            this.sprite.width = props.width;
        }

        if (props.height) {
            this.sprite.height = props.height;
        }
    }
}

export class Graphics extends Instance {
    graphics: Phaser.Graphics;
    phaser: Phaser.Game;

    private children: GraphicNodeInstance<any>[] = [];

    constructor(props: ReactPhaser.Group, host: Phaser.Game) {
        super();

        this.phaser = host;
        this.graphics = host.add.graphics();
    }

    type(): string {
        return 'graphics';
    }

    object(): Phaser.Graphics {
        return this.graphics;
    }

    appendInitialChild(child: Instance) {
        if (child) {
            (child as GraphicNodeInstance<any>).setGraphics(this)
            this.children.push(child as GraphicNodeInstance<any>);
        }
    }

    appendChild(child: Instance) {
        if (child) {
            (child as GraphicNodeInstance<any>).setGraphics(this)
            this.children.push(child as GraphicNodeInstance<any>);
            this.draw();
        }
    }

    insertBefore(child: Instance, beforeChild: Instance) {
        if (child) {
            (child as GraphicNodeInstance<any>).setGraphics(this);
            let index = this.children.findIndex(child => child === beforeChild);

            if (index >= 0) {
                this.children.splice(index, 0, child as GraphicNodeInstance<any>);
            } else {
                this.children.push(child as GraphicNodeInstance<any>);
            }

            this.draw();
        }
    }

    update(props: ReactPhaser.Group) {
        this.graphics.x = props.x || 0;
        this.graphics.y = props.y || 0;

        this.draw();
    }

    removeChild(oldChild: Instance) {
        if (oldChild) {
            this.children = this.children.filter(child => child !== oldChild)
        }
    }

    draw() {
        this.graphics.clear();

        this.children.forEach(child => child.draw())
    }
}

export class Line extends GraphicNodeInstance<ReactPhaser.Line> {
    draw() {
        this.graphics.graphics.lineStyle(this.props.width || 1, this.props.color, this.props.alpha || 1);
        this.graphics.graphics.moveTo(this.props.x, this.props.y);
        this.graphics.graphics.lineTo(this.props.endX, this.props.endY);
    }

    type(): string {
        return 'phaser_line';
    }
}

export class Rect extends GraphicNodeInstance<ReactPhaser.Rect> {
    draw() {
        this.graphics.graphics.beginFill(this.props.color);
        this.graphics.graphics.drawRect(
            this.props.x || 0,
            this.props.y || 0,
            this.props.width,
            this.props.height);
    }

    type(): string {
        return 'phaser_rect';
    }
}

export class Circle extends GraphicNodeInstance<ReactPhaser.Circle> {
    draw() {
        this.graphics.graphics.beginFill(this.props.color);
        this.graphics.graphics.drawCircle(
            this.props.x || 0,
            this.props.y || 0,
            this.props.diameter);
    }

    type(): string {
        return 'phaser_circle';
    }
}

export class Group extends Instance {
    group: Phaser.Group;
    phaser: Phaser.Game;

    private background: Phaser.Graphics;
    private input?: Phaser.Graphics;
    private clickBinding?: Phaser.SignalBinding;

    constructor(props: ReactPhaser.Group, host: Phaser.Game) {
        super();

        this.phaser = host;
        this.group = host.add.group();
    }

    type(): string {
        return 'group';
    }

    object(): Phaser.Group {
        return this.group;
    }

    update(props: ReactPhaser.Group) {
        this.group.x = props.x || 0;
        this.group.y = props.y || 0;

        if (this.input) {
            this.input.destroy();
        }

        if (props.draggable || props.onClick) {
            this.input = this.phaser.add.graphics();
            this.group.addAt(this.input, 0);
            this.input.beginFill(0xFFFFFF, 0);
            this.input.drawRect(0, 0, this.group.width, this.group.height);
            this.input.inputEnabled = true;
        }

        if (props.draggable) {
            let startX = 0;
            let startY = 0;

            this.input.input.enableDrag();

            this.input.events.onDragUpdate.add((blah, blah2, x, y) => {
                let diffX = x - startX;
                let diffY = y - startY;

                let children = this.group.children.map(child => child).filter(child => child != this.input)
                children.forEach(child => child.x += diffX);
                children.forEach(child => child.y += diffY);

                startX = x;
                startY = y;
            });

            this.input.events.onDragStop.add(() => {
                let children = this.group.children.map(child => child).filter(child => child != this.input)
                children.forEach(child => child.x -= startX);
                children.forEach(child => child.y -= startY);

                this.group.x += startX;
                this.group.y += startY;

                if (props.onDrag) {
                    props.onDrag(this.group.x, this.group.y);
                }

                this.input.x = startX = 0;
                this.input.y = startY = 0;
            });
        }

        if (props.onClick) {
            this.clickBinding = this.input.events.onInputDown.add(() => props.onClick());
        }

        if (this.background) {
            this.background.destroy();
        }

        if (props.backgroundColor) {
            this.background = this.phaser.add.graphics(0, 0);
            this.background.beginFill(props.backgroundColor);
            this.background.drawRect(0, 0, this.group.width, this.group.height);
            this.group.addAt(this.background, 0);
        }
    }

    appendInitialChild(child: Instance) {
        if (child) {
            let object = child.object();

            if (object) {
                this.group.add(object);
            }
        }
    }

    appendChild(child: Instance) {
        if (child) {
            let object = child.object();

            if (object) {
                this.group.add(object);
            }
        }
    }

    insertBefore(child: Instance, beforeChild: Instance) {
        if (child) {
            let index = this.group.children.findIndex(child => child === beforeChild.object());

            if (index >= 0) {
                this.group.addAt(child.object(), index)
            } else {
                this.group.add(child.object());
            }
        }
    }

    removeChild(child: Instance) {
        let object = child.object();
        if (object) {
            this.group.removeChild(object)
        }
    }
}