/**
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; under version 2
 * of the License (non-upgradable).
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 *
 * Copyright (c) 2016 (original work) Open Assessment Technologies SA ;
 */

/**
 * Test Runner Control Plugin : Timer
 *
 * @author Jean-Sébastien Conan <jean-sebastien.conan@vesperiagroup.com>
 */
define([
    'jquery',
    'lodash',
    'i18n',
    'core/promise',
    'core/polling',
    'core/timer',
    'core/store',
    'ui/hider',
    'taoTests/runner/plugin',
    'taoQtiTest/runner/plugins/controls/timer/timerComponent',
    'taoQtiTest/runner/helpers/messages',
    'tpl!taoQtiTest/runner/plugins/controls/timer/timers'
], function ($, _, __, Promise, pollingFactory, timerFactory, store, hider, pluginFactory, timerComponentFactory, messages, timerBoxTpl) {
    'use strict';

    /**
     * Time interval between timer refreshes, in milliseconds
     * @type {Number}
     */
    var timerRefresh = 1000;

    /**
     * Duration of a second in the timer's base unit
     * @type {Number}
     */
    var precision = 1000;

    /**
     * The message to display when exiting
     */
    var exitMessage = __('After you complete the section it would be impossible to return to this section to make changes. Are you sure you want to end the section?');


    var timerTypes = {
        test:     'assessmentTest',
        testPart: 'testPart',
        section:  'assessmentSection',
        item:     'assessmentItemRef'
    };

    var timerValuesFromStorage = {};

    /**
     * Are we in a timed section
     * @param {Object} context - the current test context
     * @returns {Boolean}
     */
    var isTimedSection = function isTimedSection(context){
        var timeConstraints = context.timeConstraints || [];
        return _.some(timeConstraints, function(constraint){
            return constraint.qtiClassName === 'assessmentSection';
        });
    };


    /**
     * Creates the timer plugin
     */
    return pluginFactory({

        name: 'timer',

        /**
         * Installation of the plugin (called before init)
         */
        install : function install() {
            var self = this;
            //the storechange event is fired early (before runner's init is done)
            //so we attach the handler early
            var testRunner = this.getTestRunner();
            testRunner.on('storechange', function handleStoreChange() {
                self.shouldClearStorage = true;
            });
        },

        /**
         * Initializes the plugin (called during runner's init)
         */
        init: function init() {

            var self = this;
            var testRunner   = this.getTestRunner();
            var testData     = testRunner.getTestData() || {};
            var itemStates   = testData.itemStates || {};
            var timerWarning = testData.config && testData.config.timerWarning || {};

            var currentTimers = {};

            /**
             * Load the configuration of a timer from the current context
             * @param {String} type - the timer type/qtiClass
             * @returns {Object} the timer config if there's one for the given type
             */
            var getTimerConfig = function getTimerConfig(type) {
                var timeConstraint;
                var timer;
                var closestPreviousWarning;
                var context = testRunner.getTestContext();

                // get the config of each timer
                if (!context.isTimeout && context.itemSessionState === itemStates.interacting) {
                    timeConstraint = _.findLast(context.timeConstraints, { qtiClassName : type });
                    if(timeConstraint){
                        timer = {
                            label:     timeConstraint.label,
                            type:      timeConstraint.qtiClassName,
                            remaining: timeConstraint.seconds * precision,
                            id:        timeConstraint.source,
                            running:   true,
                            warnings:  {}
                        };

                        _(timerWarning[timeConstraint.qtiClassName]).forEach(function (value, key) {
                            if (_.contains(['info', 'warning', 'danger'], value)) {
                                timer.warnings[key] = {
                                    type: value,
                                    showed: timer.remaining / precision <= key,
                                    point: parseInt(key, 10) * precision
                                };
                            }
                        });

                        closestPreviousWarning = _.find(timer.warnings, { showed: true });
                        if (!_.isEmpty(closestPreviousWarning) && closestPreviousWarning.point && timer.warnings[closestPreviousWarning.point / precision]) {
                            timer.warnings[closestPreviousWarning.point / precision].showed = false;
                        }
                    }
                }
                return timer;
            };

            //TODO this kind of function is generic enough to be moved to a util/helper
            var leaveTimedSection = function leaveTimedSection(type, scope, position){
                var context = testRunner.getTestContext();
                var map     = testRunner.getTestMap();

                var section = map.parts[context.testPartId].sections[context.sectionId];
                var nbItems = _.size(section.items);
                var item    = _.find(section.items, { position : context.itemPosition });

                if (!context.isTimeout && context.itemSessionState !== itemStates.closed && isTimedSection(context) && item ){

                    return !!( (type === 'next' && (scope === 'assessmentSection' || ((item.positionInSection + 1) === nbItems) )) ||
                               (type === 'previous' && item.positionInSection === 0) ||
                               (type === 'jump' && position > 0 &&  (position < section.position || position >= section.position + nbItems)) );

                }
                return false;
            };

            /**
             * Remove a timer from the current ones
             * @param {String} type - the timer type to remove
             */
            var removeTimer = function removeTimer(type){
                if(currentTimers[type]){
                    self.storage.removeItem(currentTimers[type].id());

                    currentTimers[type].destroy();
                    currentTimers = _.omit(currentTimers, type);
                }
            };

            /**
             * Add and initialize a timer of the given type
             * @param {Object} config - the timer config
             * @param {String} type - the timer type to remove
             */
            var addTimer = function addTimer(type, config){
                if(config){
                    currentTimers[type] = timerComponentFactory(config);
                    currentTimers[type]
                        .init()
                        .render(self.$element);

                    /**
                     * @event timerPlugin#addtimer
                     * @param {String} type of timer (such as 'assessmentSection', 'testPart' etc.)
                     * @param {Object} timer instance ('core/timer' timer factory).
                     */
                    self.trigger('addtimer', type, currentTimers[type]);
                }
            };

            /**
             * Update the timers.
             * It will remove, let, add or update the current timers based on the current context.
             */
            var updateTimers = function updateTimers(checkStorage){

                _.forEach(timerTypes, function(type){
                    var timerConfig = getTimerConfig(type);

                    if(currentTimers[type]){
                        if(!timerConfig){
                            removeTimer(type);
                        } else if(currentTimers[type].id() !== timerConfig.id){
                            removeTimer(type);
                            addTimer(type, timerConfig);
                        }
                    } else if(timerConfig){
                        addTimer(type, timerConfig);
                        if (checkStorage) {
                            if (timerValuesFromStorage[type]) {
                                timerConfig.remaining = timerValuesFromStorage[type];
                            }
                            //check for the last value in the storage
                            self.storage.getItem(timerConfig.id).then(function(savedTime){
                                if(_.isNumber(savedTime) && savedTime >= 0){
                                    timerConfig.remaining = savedTime;
                                }
                            })
                        }
                    }
                });
            };

            /**
             * Secured call to enable
             */
            function doEnable() {
                if (!self.getState('enabled')) {
                    self.enable();
                }
            }

            /**
             * Secured call to disable
             */
            function doDisable() {
                if (self.getState('enabled')) {
                    self.disable();
                }
            }

            return store('timer-' + testRunner.getConfig().serviceCallId)
                .then(function(timeStore){
                    if(self.shouldClearStorage){
                        return timeStore.clear().then(function(){
                            return timeStore;
                        });
                    }
                    return Promise.resolve(timeStore);
                }).then(function(timeStore){

                    //the timer's storage
                    self.storage = timeStore;

                    //the element that'll contain the timers
                    self.$element = $(timerBoxTpl());

                    //one stopwatch to count the time
                    self.stopwatch = timerFactory({
                        autoStart : false
                    });

                    //update the timers at regular intervals
                    self.polling = pollingFactory({

                        /**
                        * The polling action consists in updating each timers,
                        * checking timeout and warnings
                        */
                        action : function updateTime() {

                            //how many time elapsed from the last tick ?
                            var elapsed = self.stopwatch.tick();
                            var timeout = false;
                            var timeoutScope, timeoutRef;

                            _.forEach(currentTimers, function(timer, type) {
                                var currentVal,
                                    warning;
                                var runTimeout = function runTimeout(){
                                    testRunner.timeout(timeoutScope, timeoutRef);
                                };

                                if (timer.running()) {
                                    currentVal = Math.max(timer.val() - elapsed, 0);
                                    timer
                                        .val(currentVal)
                                        .refresh();

                                    if (currentVal <= 0) {
                                        timer.running(false);
                                        timeout = true;
                                        timeoutRef = timer.id();
                                        timeoutScope = type;

                                        self.storage.setItem(timer.id(), 0)
                                            .then(runTimeout)
                                            .catch(runTimeout);

                                    } else {
                                        self.storage.setItem(timer.id(), currentVal);
                                        warning = timer.warn();
                                        if (!_.isEmpty(warning)) {
                                            testRunner.trigger(warning.type, warning.text);
                                        }
                                    }
                                }
                            });
                            if (timeout) {
                                self.disable();
                            }
                        },
                        interval : timerRefresh,
                        autoStart : false
                    });

                    //try to find timer values in the storage
                    _.forEach(timerTypes, function(type){
                        var timerId;
                        var context = testRunner.getTestContext();
                        var timeConstraint;
                        if (!context.isTimeout && context.itemSessionState === itemStates.interacting) {
                            timeConstraint = _.findLast(context.timeConstraints, { qtiClassName : type });
                            if (timeConstraint) {
                                timerId = timeConstraint.source;
                                self.storage.getItem(timerId).then(function(savedTime){
                                    if (_.isNumber(savedTime) && savedTime >= 0) {
                                        timerValuesFromStorage[type] = savedTime;
                                    }
                                });
                            }
                        }
                    });

                    //change plugin state
                    testRunner
                        .on('loaditem resumeitem', function(){
                            //check for new timers
                            updateTimers(true);
                        })
                        .on('enableitem', doEnable)
                        .on('disableitem disconnect', doDisable)
                        .after('renderitem', doEnable)
                        .before('move', function(e, type, scope, position){
                            var context = testRunner.getTestContext();
                            var testData = testRunner.getTestData();
                            var config = testData && testData.config;
                            var timerConfig = config && config.timer || {};
                            var options = context && context.options || {};

                            var movePromise = new Promise(function(resolve, reject) {
                                // endTestWarning has already been displayed, so we don't repeat the warning
                                if (context.isLast && options.endTestWarning) {
                                    resolve();
                                // display a message if we exit a timed section
                                } else if(leaveTimedSection(type, scope, position) && !options.noExitTimedSectionWarning && !timerConfig.keepUpToTimeout) {
                                    testRunner.trigger('confirm.exittimed', messages.getExitMessage(exitMessage, 'section', testRunner), resolve, reject);
                                } else {
                                    resolve();
                                }
                            });

                            movePromise
                                .then(function doMove(){
                                    //pause the timers when moving
                                    doDisable();
                                    removeTimer(timerTypes.item);
                                })
                                .catch(function cancelMove() {
                                    testRunner.trigger('enableitem enablenav');
                                });

                            return movePromise;
                        })
                        .before('finish', function(){
                            return new Promise(function(resolve) {
                                self.storage.removeStore()
                                    .then(resolve)
                                    .catch(resolve);
                            });
                        });
                });
        },

        /**
         * Called during the runner's render phase
         */
        render: function render() {
            var $container = this.getAreaBroker().getControlArea();
            $container.append(this.$element);
        },

        /**
         * Called during the runner's destroy phase
         */
        destroy : function destroy (){
            this.polling.stop();
            this.stopwatch.stop();
            this.$element.remove();
        },

        /**
         * Enables the timers
         */
        enable : function enable (){
            this.polling.start();
            this.stopwatch.resume();
        },

        /**
         * Disables the timers
         */
        disable : function disable (){
            this.polling.stop();
            this.stopwatch.pause();
        },

        /**
         * Shows the timers
         */
        show: function show(){
            hider.show(this.$element);
        },

        /**
         * Hides the timers
         */
        hide: function hide(){
            hider.hide(this.$element);
        }
    });
});
