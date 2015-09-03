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
 * Copyright (c) 2015 (original work) Open Assessment Technologies SA ;
 */
/**
 * @author Jean-Sébastien Conan <jean-sebastien.conan@vesperiagroup.com>
 */
define([
    'jquery',
    'lodash',
    'core/eventifier',
    'core/promise',
    'taoQtiTest/testRunner/actionBarHook'
], function ($, _, eventifier, Promise, actionBarHook) {
    'use strict';

    /**
     * The list of registered actionBar tools
     * @type {Object}
     */
    var qtiTools;

    /**
     * Manages the actionBar tools
     * @type {Object}
     */
    var actionBarTools = {
        /**
         * Registers the actionBar tools
         * @param {Object} tools
         */
        register : function register(tools) {
            var registerTools = tools || {};

            /**
             * @event actionBarTools#beforeregister
             * @param {Object} tools
             * @param {actionBarTools} this
             */
            this.trigger('beforeregister', registerTools, this);

            qtiTools = registerTools;

            /**
             * @event actionBarTools#afterregister
             * @param {Object} tools
             * @param {actionBarTools} this
             */
            this.trigger('afterregister', registerTools, this);
        },

        /**
         * Gets a particular tool
         * @param {String} id
         * @returns {Object}
         */
        get : function get(id) {
            return qtiTools && qtiTools[id];
        },

        /**
         * Gets the list of registered tools
         * @returns {Object}
         */
        list : function list() {
            return qtiTools || {};
        },

        /**
         * Renders the actionBar
         * @param {String|jQuery|HTMLElement} container - The container in which renders the tools
         * @param {Object} testContext - The assessment test context
         * @param {Object} testRunner - The assessment test runner
         * @param {Function} [callback] - An optional callback fired when all tools have been rendered
         */
        render : function render(container, testContext, testRunner, callback) {
            var self = this;
            var $container = $(container);
            var promises = [];

            /**
             * @event actionBarTools#beforerender
             * @param {jQuery} $container
             * @param {Object} testContext
             * @param {Object} testRunner
             * @param {actionBarTools} this
             */
            this.trigger('beforerender', $container, testContext, testRunner, this);

            _.forIn(this.list(), function(toolconfig, id){
                promises.push(actionBarHook.initQtiTool($container, id, toolconfig, testContext, testRunner));
            });

            Promise.all(promises).then(function() {
                if (_.isFunction(callback)) {
                    callback.call(self, $container, testContext, testRunner, self);
                }

                /**
                 * @event actionBarTools#afterrender
                 * @param {jQuery} $container
                 * @param {Object} testContext
                 * @param {Object} testRunner
                 * @param {actionBarTools} this
                 */
                self.trigger('afterrender', $container, testContext, testRunner, self);
            });
        }
    };

    return eventifier(actionBarTools);
});
