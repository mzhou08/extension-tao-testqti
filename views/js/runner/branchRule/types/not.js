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
 * Copyright (c) 2019 (original work) Open Assessment Technologies SA ;
 */
/**
 * @author Péter Halász <peter@taotesting.com>
 */
define([
    'lodash'
], function(
    _
) {
    'use strict';

    /**
     * NOT branching rule
     */
    return function notBranchRuleFactory(branchRuleDefinition, item, navigationParams, branchRuleMapper, responseStore) {
        // If the NOT branching rule has only one child, cast it as an array
        if (!Array.isArray(branchRuleDefinition)) {
            branchRuleDefinition = [branchRuleDefinition];
        }

        return {
            /**
             * Evaluates a NOT expression on the given expressions and returns an array of results
             * @returns {boolean[]}
             */
            validate: function validate() {
                return branchRuleDefinition.map(function(expression) {
                    var subBranchRuleName = _.head(_.keys(expression)),
                        subBranchRuleDefinition = expression[subBranchRuleName];

                    return !branchRuleMapper(
                        subBranchRuleName,
                        subBranchRuleDefinition,
                        item,
                        navigationParams,
                        responseStore
                    ).validate();
                });
            }
        };
    };
});
