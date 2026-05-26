/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import GObject from 'gi://GObject';
import St from 'gi://St';

import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
// ------------------
import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib'

const Indicator = GObject.registerClass(
class Indicator extends PanelMenu.Button {
    _init() {
        super._init(0.0, _('My Shiny Indicator'));

        //A box (container class) to hold icon + label side by side
        let box = new St.BoxLayout({ style_class: 'panel-status-menu-box'})

        // The icon
        let icon = new St.Icon({
            icon_name:  'timer-symbolic',
            style_class:'system-status-icon'
        });

        // A label next to icon
        this._label = new St.Label({
            text: "24:00",
            y_align: Clutter.ActorAlign.CENTER,
        });

        // Simple: text-only menu item with icon via PopupImageMenuItem
        let item = new PopupMenu.PopupImageMenuItem(
            'Start 25 min session',   // label
            'timer-symbolic'           // icon shown on the left
        );
        

        box.add_child(icon);
        box.add_child(this._label);
        this.add_child(box);
        this.menu.addMenuItem(item);

        // Stopwatch state variables
        this._elapsedMs = 0;          // Total elapsed time in milliseconds
        this._startTime = null;        // When the stopwatch started
        this._isRunning = false;       // Is stopwatch currently running
        this._timerId = null;          // Timer ID for updates

        // Create menu section
        this._createMenuItems();
    }

    _createMenuItems() {
        let displayBox = new St.BoxLayout({ virtical: true, style_class: null, });

        // larg time display
        this._displayLabel = new St.Label({
            text: '00:00',
            style_class: null,
        })

        displayBox.add_child(this._displayLabel);

                // Separator
        let separator = new PopupMenu.PopupSeparatorMenuItem();
        this.menu.addMenuItem(separator);

        // Button box
        let buttonBox = new St.BoxLayout({
            style_class: 'panel-status-menu-box'
        });

                // Start button
        this._startBtn = new St.Button({
            label: '▶ Start',
            style_class: 'stopwatch-btn stopwatch-btn-start'
        });
        this._startBtn.connect('clicked', () => this._start());
        buttonsBox.add_child(this._startBtn);

    }
});

export default class IndicatorExampleExtension extends Extension {
    enable() {
        try {
            this._indicator = new Indicator();
            Main.panel.addToStatusArea(this.uuid, this._indicator);
            console.log("Activated ✅");
        } catch (e) {
            logError(e);
            // best-effort cleanup
            try {
                if (this._indicator) {
                    this._indicator.destroy();
                }
            } catch (err) {
                logError(err);
            }
            this._indicator = null;
        }
    }

    disable() {
        try {
            if (this._indicator) {
                this._indicator.destroy();
                this._indicator = null;
            }
            console.log("Deactivated ❌");
        } catch (e) {
            logError(e);
            // ensure we don't leave a dangling reference
            this._indicator = null;
        }
    }
}
