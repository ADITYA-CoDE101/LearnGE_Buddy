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
            text: "00:00",
            y_align: Clutter.ActorAlign.CENTER,
        });

        // Simple: text-only menu item with icon via PopupImageMenuItem
        let item = new PopupMenu.PopupImageMenuItem(
            'The Study Time! ',   // label
            'timer-symbolic'              // icon shown on the left
        );

        let item2 = new PopupMenu.PopupImageMenuItem(
            "CDS Prep",
            'battery-lightning-symbolic'
        );
        

        box.add_child(icon);
        box.add_child(this._label);
        this.add_child(box);
        this.menu.addMenuItem(item);
        this.menu.addMenuItem(item2);

        // Stopwatch state variables
        this._elapsedMs = 0;          // Total elapsed time in milliseconds
        this._startTime = null;        // When the stopwatch started
        this._isRunning = false;       // Is stopwatch currently running
        this._timerId = null;          // Timer ID for updates

        // Create menu section
        this._createMenuItems();
    }

    _createMenuItems() {
        let displayBox = new St.BoxLayout({ vertical: true, style_class: null });

        // large time display
        this._displayLabel = new St.Label({
            text: '00:00',
            style_class: null,
        });
        displayBox.add_child(this._displayLabel);

        let displayItem = new PopupMenu.PopupBaseMenuItem({ activate: false });
        displayItem.actor.add_child(displayBox);
        this.menu.addMenuItem(displayItem);

        // Separator
        // let separator = new PopupMenu.PopupSeparatorMenuItem();
        // this.menu.addMenuItem(separator);            OR ↓
        //                                                 ↓
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

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
        buttonBox.add_child(this._startBtn);

        // Pause button
        this._pauseBtn = new St.Button({
            label: '⏸ Pause',
            style_class: 'stopwatch-btn stopwatch-btn-pause'
        });
        this._pauseBtn.connect('clicked', () => this._pause());
        this._pauseBtn.reactive = false;  // Disabled until started
        buttonBox.add_child(this._pauseBtn);

        // Reset button
        this._resetBtn = new St.Button({
            label: '⟲ Reset',
            style_class: 'stopwatch-btn stopwatch-btn-reset'
        });
        this._resetBtn.connect('clicked', () => this._reset());
        buttonBox.add_child(this._resetBtn);

        // Add items to menu
        let btnItem = new PopupMenu.PopupBaseMenuItem({ activate: false });
        btnItem.actor.add_child(buttonBox);
        this.menu.addMenuItem(btnItem);
    }

    _start() {
        if (!this._isRunning) {
            this._isRunning = true;
            this._startTime = GLib.get_monotonic_time() / 1000 - this._elapsedMs;
            
            // Update every 100ms
            this._timerId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 100, () => {
                this._updateDisplay();
                return true; // Keep timer running
            });

            // Update button states
            this._startBtn.reactive = false;
            this._pauseBtn.reactive = true;
        }
    }

    _pause() {
        if (this._isRunning) {
            this._isRunning = false;
            
            // Remove timer
            if (this._timerId) {
                GLib.source_remove(this._timerId);
                this._timerId = null;
            }

            // Update button states
            this._startBtn.reactive = true;
            this._pauseBtn.reactive = false;
        }
    }

    _reset() {
        // Stop the timer if running
        if (this._isRunning) {
            this._pause();
        }

        // Reset all values
        this._elapsedMs = 0;
        this._startTime = null;
        
        // Update displays
        this._updateDisplay();
        
        // Reset button states
        this._startBtn.reactive = true;
        this._pauseBtn.reactive = false;
    }

    _updateDisplay() {
        // Calculate elapsed time
        if (this._isRunning) {
            this._elapsedMs = GLib.get_monotonic_time() / 1000 - this._startTime;
        }

        // Format time as MM:SS
        let totalSeconds = Math.floor(this._elapsedMs / 1000);
        let minutes = Math.floor(totalSeconds / 60);
        let seconds = totalSeconds % 60;

        let timeStr = this._formatTime(minutes, seconds);

        // Update labels
        this._label.text = timeStr;
        this._displayLabel.text = timeStr;
    }

    _formatTime(minutes, seconds) {
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
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

                // Stop the timer first befor stoping the actual object

                if(this._indicator._timerId){
                    GLib.source_remove(this._indicator._timerId);
                    this._indicator._timerId = null;
                }
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
