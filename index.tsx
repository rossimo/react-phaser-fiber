/// <reference path="node_modules/phaser-ce/typescript/phaser.d.ts"/>

import 'pixi.js'
import 'p2'
import 'phaser'
import * as _ from 'lodash'
import * as React from 'react'
import { Diff, Instance, Sprite, Graphics, Group, Line, Rect, Circle } from './nodes';

interface Props {
    [key: string]: any
}

export type Container = string;
export type TextInstance = null;
export type OpaqueHandle = Object;

let log = function (...stuff) { console.log.apply(this, stuff) };

let DEBUG = false;
let debug = function (...stuff) { if (DEBUG) { console.log.apply(this, stuff) } };

let ReactFiberReconciler = require('react-dom/lib/ReactFiberReconciler');

const PhaserRenderer = ReactFiberReconciler({
    createInstance(
        type: string,
        props: any,
        parent: Instance,
        host: Phaser.Game
    ): Instance {
        debug('createInstance: ' + type)

        switch (type) {
            case 'graphics': return new Graphics(props, host);
            case 'group': return new Group(props, host);
            case 'sprite': return new Sprite(props, host);
            case 'phaser_line': return new Line();
            case 'phaser_rect': return new Rect();
            case 'phaser_circle': return new Circle();
            case 'game': return {} as Instance;
        }
    },

    // HostContext is an internal object or reference for any bookkeeping your
    // renderer may need to do based on current location in the tree. In DOM this
    // is necessary for calling the correct `document.createElement` calls based
    // upon being in an `html`, `svg`, `mathml`, or other context of the tree.

    getRootHostContext(container: Container): Phaser.Game {
        debug('getRootHostContext')
        return games[container];
    },

    // this is called instead of `appendChild` when the parentInstance is first
    // being created and mounted
    // added in https://github.com/facebook/react/pull/8400/
    appendInitialChild(
        parent: Instance,
        child: Instance
    ): void {
        debug('appendInitialChild', child)

        if (parent && parent.appendInitialChild) {
            parent.appendInitialChild(child);
        }
    },

    appendChild(
        parent: Instance,
        child: Instance
    ): void {
        debug('appendChild', child);

        if (parent && parent.appendChild) {
            parent.appendChild(child);
        }
    },

    removeChild(
        parent: Instance,
        child: Instance | TextInstance
    ): void {
        debug('removeChild', child);

        if (parent && parent.removeChild) {
            parent.removeChild(child);
        }
    },

    insertBefore(
        parent: Instance,
        child: Instance,
        beforeChild: Instance
    ): void {
        debug('insertBefore');

        if (parent && parent.insertBefore) {
            parent.insertBefore(child, beforeChild);
        }
    },

    // finalizeInitialChildren is the final HostConfig method called before
    // flushing the root component to the host environment

    finalizeInitialChildren(
        instance: Instance,
        type: string,
        props: Props,
        rootContainerInstance: Container
    ): boolean {
        debug('finalizeInitialChildren', instance);

        if (instance && instance.finalizeInitialChildren) {
            instance.finalizeInitialChildren(props);
        }

        return false;
    },

    // prepare update is where you compute the diff for an instance. This is done
    // here to separate computation of the diff to the applying of the diff. Fiber
    // can reuse this work even if it pauses or aborts rendering a subset of the
    // tree.

    prepareUpdate(
        instance: Instance,
        type: string,
        oldProps: Props,
        newProps: Props,
        rootContainerInstance: Container,
        hostContext: Phaser.Game
    ): Diff {
        debug('prepareUpdate: ' + type);

        if (instance && instance.prepareUpdate) {
            return instance.prepareUpdate(oldProps, newProps);
        } else {
            return null;
        }
    },

    commitUpdate(
        instance: Instance,
        diff: Diff,
        type: string,
        oldProps: Props,
        newProps: Props,
        internalInstanceHandle: Object,
    ): void {
        // Apply the diff to the DOM node.
        // updateProperties(instance, updatePayload, type, oldProps, newProps);
        debug('updateProperties: ' + type);

        if (instance && instance.update) {
            instance.update(newProps);
        }
    },

    // commitMount is called after initializeFinalChildren *if*
    // `initializeFinalChildren` returns true.

    commitMount(
        instance: Instance,
        type: string,
        newProps: Props,
        internalInstanceHandle: Object
    ) {
        debug('commitMount');
        // noop
    },

    getChildHostContext(parentHostContext: Phaser.Game, type: string): Phaser.Game {
        return parentHostContext;
    },

    // getPublicInstance should be the identity function in 99% of all scenarios.
    // It was added to support the `getNodeMock` functionality for the
    // TestRenderers.

    getPublicInstance(instance: Instance | TextInstance) {
        return instance;
    },

    // the prepareForCommit and resetAfterCommit methods are necessary for any
    // global side-effects you need to trigger in the host environment. In
    // ReactDOM this does things like disable the ReactDOM events to ensure no
    // callbacks are fired during DOM manipulations

    prepareForCommit(): void {
        debug('prepareForCommit');
        // noop
    },

    resetAfterCommit(): void {
        debug('resetAfterCommit');
        // noop
    },

    // the following four methods are regarding TextInstances. In our example
    // renderer we don’t have specific text nodes like the DOM does so we’ll just
    // noop all of them.

    shouldSetTextContent(props: Props): boolean {
        return false
    },

    resetTextContent(instance: Instance): void {
        // noop
    },

    createTextInstance(
        text: string,
        rootContainerInstance: Container,
        hostContext: Phaser.Game,
        internalInstanceHandle: OpaqueHandle
    ): TextInstance {
        return null;
    },

    commitTextUpdate(
        textInstance: TextInstance,
        oldText: string,
        newText: string
    ): void {
        throw new Error('commitTextUpdate should not be called');
    },

    scheduleAnimationCallback() {
        debug('scheduleAnimationCallback');
    },

    scheduleDeferredCallback() {
        debug('scheduleDeferredCallback');
    },

    useSyncScheduling: true,
});

/**
 * Our public renderer. When someone requires your renderer, this is all they
 * should have access to. `render` and `unmountComponentAtNode` methods should
 * be considered required, though that isn’t strictly true.
 */
export let ReactPhaser = {
    render(
        element: React.ReactElement<ReactPhaser.Game>,
        container: string
    ) {
        let root = roots[container];

        if (root) {
            PhaserRenderer.updateContainer(element, root, null)
        } else {
            let game = new Phaser.Game(element.props.width || 800, element.props.height || 600, Phaser.AUTO, container, {
                preload: () => {
                    if (element.props.assets) {
                        element.props.assets.forEach(asset => {
                            switch (asset.type) {
                                case 'image': {
                                    game.load.image(asset.key, asset.location)
                                } break;
                            }
                        })
                    }
                },
                create: () => {
                    let root = PhaserRenderer.createContainer(container);
                    roots[container] = root;
                    games[container] = game;
                    PhaserRenderer.updateContainer(element, root, null)
                }
            });
        }
    }
};

const roots: { [key: string]: Container } = {};
const games: { [key: string]: Phaser.Game } = {};
