/// <reference path="../types.d.ts"/>

import * as React from 'react'
import { ReactPhaser } from '../index'

let game = <game>
    <graphics>
        <phaser_circle x={100} y={100} diameter={50} />
    </graphics>
</game>;

ReactPhaser.render(game, 'game')