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

import interactionSelectors, {commonInteractionSelectors, matchInteractionSelectors} from '../../_helpers/selectors/interactionSelectors';

import '../../_helpers/commands/setupCommands';
import '../../_helpers/commands/cleanupCommands';
import '../../_helpers/routes/backOfficeRoutes';
import '../../_helpers/routes/runnerRoutes';

import base64Test from './fixtures/base64ChoiceInteractionTestPackage';

describe('Interactions', () => {

    /**
     * Setup to have a proper delivery:
     * - Start server
     * - Add necessary routes
     * - Admin login
     * - Import test package
     * - Publish imported test as a delivery
     * - Set guest access on delivery and save
     * - Logout
     */
    before(() => {
        cy.setupServer();
        cy.addBackOfficeRoutes();
        cy.login('admin');
        cy.importTestPackage(base64Test, 'match');
        cy.publishTest('match');
        cy.setDeliveryForGuests('Delivery of match');
        cy.logout();
    });

    /**
     * Log in & start the test
     */
    beforeEach(() => {
        cy.setupServer();
        cy.addRunnerRoutes();
        cy.guestLogin();
        cy.startTest('match');
    });

    /**
     * Destroy everything we created during setup, leaving the environment clean for next time.
     */
    after(() => {
        cy.setupServer();
        cy.addBackOfficeRoutes();
        cy.login('admin');
        cy.deleteItem('match');
        cy.deleteTest('match');
        cy.deleteDelivery('Delivery of match');
    });

    /**
     * Interaction tests
     */
    describe('Match interaction', () => {
        it('Essential elements exist', () => {
            cy.get(commonInteractionSelectors.interaction).within(() => {
                cy.get(commonInteractionSelectors.qtiChoice).should('exist');
                cy.get(matchInteractionSelectors.interactionArea).within(() => {
                    cy.get(commonInteractionSelectors.checkboxIcon).should('exist');
                });
            });
        });

        it('Can interact with checkbox', () => {
            cy.get(matchInteractionSelectors.interactionArea).within(() => {
                cy.get(commonInteractionSelectors.checkboxIcon).first().click();

            });
        });
    });
});
