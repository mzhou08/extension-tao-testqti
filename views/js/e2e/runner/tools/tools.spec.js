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

import '../../_helpers/commands/setupCommands';
import '../../_helpers/commands/pointerCommands';
import '../../_helpers/commands/cleanupCommands';
import '../../_helpers/routes/testExecutionRoutes';
import '../../_helpers/routes/runnerRoutes';

import base64Test from './fixtures/base64TestTakerToolsTestPackage';

describe('Tools', () => {

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
        cy.addRoutes();
        cy.addExecutionRoutes();
        // cy.login('admin');
        // cy.importTestPackage(base64Test, 'e2e Tools test');
        // cy.publishTest('e2e Tools test');
        // cy.setDeliveryForGuests('e2e Tools test');
        // cy.logout();
        cy.guestLogin();
        cy.startTest('e2e Tools test');
    });

    /**
     * Log in & start the test
     */
    beforeEach(() => {
        cy.setupServer();
        cy.addRoutes();
        cy.addExecutionRoutes();
        // cy.guestLogin();
        // cy.startTest('e2e Tools test');
    });

    /**
     * Log out
     */
    afterEach(() => {
        // cy.guestLogout();
    });

    /**
     * Destroy everything we created during setup, leaving the environment clean for next time.
     */
    after(() => {
        // cy.login('admin');
        // cy.deleteItem('e2e Tools test');
        // cy.deleteTest('e2e Tools test');
        // cy.deleteDelivery('Delivery of e2e Tools test');
    });

    /**
     * Tools tests
     */
    describe('Test-Taker Tools', () => {

        it('Has comments tool', function() {
            cy.get('.tools-box-list [data-control=comment]').within(() => {
                cy.get('a').as('toolBtn');
                cy.get('[data-control=qti-comment]').as('popup');
                cy.get('[data-control=qti-comment-text]').as('textarea');
                cy.get('[data-control=qti-comment-cancel]').as('cancelBtn');
                cy.get('[data-control=qti-comment-send]').as('submitBtn');

                // plugin loaded?
                cy.get('@toolBtn').should('be.visible');
                // click tool => textarea visible
                cy.get('@toolBtn').click();
                cy.get('@popup').should('be.visible');
                // click tool => textarea closes
                cy.get('@toolBtn').click();
                cy.get('@popup').should('not.be.visible');
                // click tool => textarea visible
                cy.get('@toolBtn').click();
                // cancel => textarea closes
                cy.get('@cancelBtn').click();
                cy.get('@popup').should('not.be.visible');
                // click tool => textarea visible
                cy.get('@toolBtn').click();
                cy.get('@popup').should('be.visible');
                cy.get('@textarea').should('have.attr', 'placeholder', 'Your comment…');
                // empty => cannot submit
                cy.get('@submitBtn').click();
                cy.get('@popup').should('be.visible');
                // type text => can submit
                cy.get('@textarea').type('Blah blah blah');
                // submit => textarea closes
                cy.get('@submitBtn').click();
                cy.get('@popup').should('not.be.visible');
                // xhr
                cy.wait('@comment').then((xhr) => {
                    assert.ok(xhr.response.body.success, 'comment response success true');
                });
            });
        });

        it('Has calculator tool', function() {
            cy.get('.tools-box-list [data-control=calculator] a').as('toolBtn');
            // plugin loaded?
            cy.get('@toolBtn').should('be.visible');
            cy.get('.test-runner-scope .widget-calculator').as('calcContainer');
            cy.get('@calcContainer').should('be.empty').and('not.be.visible');

            // click tool => calc renders
            cy.get('@toolBtn').click();
            cy.get('@calcContainer').find('.dynamic-component-container').as('calc');
            cy.get('@calc').should('be.visible');
            cy.get('@calc').find('a[title="Close"]').as('closer');
            cy.get('@calc').find('.calcDisplay').as('display');
            cy.get('@calc').find('[data-key="2"]').as('key2');
            cy.get('@calc').find('[data-key="+"]').as('plus');
            cy.get('@calc').find('[data-key="="]').as('equals');
            cy.get('@calc').find('[data-key="C"]').as('clear');

            // click tool => hide
            cy.get('@toolBtn').click();
            cy.get('@calc').should('not.be.visible');
            // click tool => calc visible
            cy.get('@toolBtn').click();
            cy.get('@calc').should('be.visible');
            // click close => hide
            cy.get('@closer').click();
            cy.get('@calc').should('not.be.visible');
            // click tool => calc visible
            cy.get('@toolBtn').click();

            // 2 + 2 => 4
            cy.get('@key2').click();
            cy.get('@plus').click();
            cy.get('@key2').click();
            cy.get('@equals').click();
            cy.get('@display').should('have.value', '4');
            // clear
            cy.get('@clear').click();
            cy.get('@display').should('have.value', '0');

            // TODO: draggable
            // TODO: resizable

            cy.get('@closer').click();
        });

        it('Has zoom tool', function() {
            cy.get('.tools-box-list').within(() => {
                cy.get('[data-control=zoomOut]').as('zoomOut');
                cy.get('[data-control=zoomIn]').as('zoomIn');
                // plugin loaded?
                cy.get('@zoomOut').should('exist').and('be.visible');
                cy.get('@zoomIn').should('exist').and('be.visible');
            });
            cy.get('.test-runner-scope .qti-item').as('item');

            // zoom out
            cy.get('@zoomOut').click();
            cy.get('@item')
                .should('have.class', 'transform-scale')
                // .and('have.css', 'transform-origin', '0px 0px');
                .and('have.attr', 'style').and('contain', 'scaleX(0.9)').and('contain', 'scaleY(0.9)');
            cy.get('@zoomOut').click();
            cy.get('@item')
                .should('have.class', 'transform-scale')
                .and('have.attr', 'style').and('contain', 'scaleX(0.8)').and('contain', 'scaleY(0.8)');

            // reset
            cy.get('@zoomIn').click();
            cy.get('@zoomIn').click();

            // zoom in
            cy.get('@zoomIn').click();
            cy.get('@item')
                .should('have.class', 'transform-scale')
                .and('have.attr', 'style').and('contain', 'scaleX(1.1)').and('contain', 'scaleY(1.1)');
            cy.get('@zoomIn').click();
            cy.get('@item')
                .should('have.class', 'transform-scale')
                .and('have.attr', 'style').and('contain', 'scaleX(1.2)').and('contain', 'scaleY(1.2)');

            // beyond the max! (2.0)
            cy.get('@zoomIn').click().click().click().click().click().click().click().click().click().click();
            cy.get('@item')
                .should('have.class', 'transform-scale')
                .and('have.attr', 'style').and('contain', 'scaleX(2)').and('contain', 'scaleY(2)');

            // reset
            cy.get('@zoomOut').click().click().click().click().click().click().click().click().click().click();
            cy.get('@item')
                .should('not.have.class', 'transform-scale')
                .should('have.css', 'transform', 'none');
        });

        it('Has highlighter tool', function() {
            cy.get('.tools-box-list').within(() => {
                // plugin loaded?
                cy.get('[data-control=highlight-trigger]').as('trigger');
                cy.get('[data-control=highlight-clear]').as('clear');
                cy.get('@trigger').should('exist').and('be.visible');
                cy.get('@clear').should('exist').and('be.visible');
            });
            cy.get('.test-runner-scope .qti-item').within(() => {
                // tool first mode
                cy.get('@trigger').click();
                cy.get('h1').selectText();
                cy.get('h1').find('span.txt-user-highlight')
                    .contains('Tools')
                    .and('has.css', 'background-color', 'rgb(255, 255, 0)');

                // clear
                cy.get('@clear').click();
                cy.get('.qti-itemBody').should('not.contain', 'span.txt-user-highlight');

                // selection first mode
                cy.get('.qti-prompt').selectText();
                cy.get('@trigger').click();
                cy.get('.qti-prompt').find('span.txt-user-highlight')
                    .contains('Here is the test for Answer Elimination and Answer Masking')
                    .and('has.css', 'background-color', 'rgb(255, 255, 0)');

                // clear
                cy.get('@clear').click();
                cy.get('.qti-itemBody').should('not.contain', 'span.txt-user-highlight');

                // turn on, off
                cy.get('@trigger').click();
                cy.get('@trigger').click();
                cy.get('h1').selectText()
                    .should('not.contain', 'span.txt-user-highlight');

            });
        });

        it('Has line reader tool', function() {
            cy.get('.tools-box-list').within(() => {
                // plugin loaded?
                cy.get('[data-control=line-reader]').as('toolBtn');
                cy.get('@toolBtn').should('exist').and('be.visible');
            });
            cy.get('.test-runner-scope').within(() => {
                // open/close toolBtn
                cy.get('@toolBtn').click();
                cy.get('.line-reader-mask').as('maskParts').should('have.length', 8).and('be.visible');
                cy.get('.line-reader-overlay').as('overlay').should('be.visible');
                cy.get('.line-reader-overlay .icon').as('outerDrag').should('be.visible');
                cy.get('.line-reader-inner-drag').as('innerDrag').should('be.visible');
                cy.get('.line-reader-closer').as('closer').should('be.visible');
                cy.get('@maskParts').should('be.visible');
                cy.get('@toolBtn').click();
                cy.get('@maskParts').should('not.be.visible');

                // open + closer
                cy.get('@toolBtn').click();
                cy.get('@maskParts').should('be.visible');
                cy.get('@closer').click();
                cy.get('@maskParts').should('not.be.visible');

                // item visibility checks
                cy.get('@toolBtn').click();
                cy.log('efp1', document.elementFromPoint(100, 100));

                // TODO: draggable
                cy.get('@overlay')
                    .trigger('mouseover')
                    .trigger('mousedown', { which: 1 })
                    .trigger('dragstart', {})
                    .trigger('mousemove', { clientX: 1000, clientY: 1000 })
                    .trigger('drag')
                    .trigger('mouseup', { force: true })
                    .trigger('dragend', {});

                // TODO: resizable
                // TODO: resizable inner

                // hide
                cy.get('@toolBtn').click();
            });
        });

        it('Has answer masking tool', function() {
            // plugin loaded?
            cy.get('.tools-box-list [data-control=answer-masking]').as('toolBtn');
            cy.get('@toolBtn').should('exist').and('be.visible');
            cy.get('.qti-choice').as('choices').should('have.length', 4);

            // click tool => masks visible
            cy.get('@toolBtn').click();
            cy.get('.qti-choice.masked').should('have.length', 4);
            cy.get('.qti-choice.masked .answer-mask.masked').should('have.length', 4);
            // choices not visible
            cy.get('.qti-choice').find('.pseudo-label-box').should('have.length', 4);//.and('not.be.visible');
            // click tool => masks hidden
            cy.get('@toolBtn').click();
            cy.get('.qti-choice.masked').should('have.length', 0);
            cy.get('.qti-choice.masked .answer-mask.masked').should('have.length', 0);
            // click tool => masks visible
            cy.get('@toolBtn').click();

            // unmask first choice
            cy.get('.qti-choice.masked:eq(0) .answer-mask-toggle').as('toggle1');
            cy.get('@toggle1').click();
            cy.get('.qti-choice.masked').should('have.length', 3);
            cy.get('.qti-choice.masked .answer-mask.masked').should('have.length', 3);
            cy.get('.qti-choice:eq(0) .answer-mask').invoke('width').should('be.lt', 40);

            // remask first choice
            cy.get('@toggle1').click();
            cy.get('.qti-choice.masked').should('have.length', 4);
            cy.get('.qti-choice.masked .answer-mask.masked').should('have.length', 4);
            cy.get('.qti-choice:eq(0) .answer-mask').invoke('width').should('be.gt', 40);

            // TODO: see if .pseudo-label-box is covered by .answer-mask

            // hide tool
            cy.get('@toolBtn').click();
        });

        it('Has answer elimination tool', function() {
            // plugin loaded?
            cy.get('.tools-box-list [data-control=eliminator] a').as('toolBtn');
            cy.get('@toolBtn').should('be.visible');

            cy.get('.qti-itemBody').within(() => {
                // turn on
                cy.get('@toolBtn').click();
                cy.get('.qti-choice [data-eliminable="container"]').should('have.length', 4).and('be.visible');
                cy.get('.qti-choice [data-eliminable="trigger"]').should('have.length', 4).and('be.visible');

                // toggle first choice
                cy.get('.qti-choice:eq(0) [data-eliminable="trigger"]').click();
                cy.get('.qti-choice:eq(0)').should('have.class', 'eliminated');
                // TODO: assert .real-label & .label-box not actionable

                // untoggle first choice
                cy.get('.qti-choice:eq(0) [data-eliminable="trigger"]').click();
                cy.get('.qti-choice:eq(0)').should('not.have.class', 'eliminated');
                // TODO: assert .real-label & .label-box not actionable

                // turn off
                cy.get('@toolBtn').click();
                cy.get('.qti-choice [data-eliminable="container"]').should('have.length', 4).and('not.be.visible');
                cy.get('.qti-choice [data-eliminable="trigger"]').should('have.length', 4).and('not.be.visible');
            });
        });

        it('Has area mask tool', function() {
            // plugin loaded?
            cy.get('.tools-box-list [data-control=area-masking] a').as('toolBtn');
            cy.get('@toolBtn').should('be.visible');

            // click tool => areaMask renders
            cy.get('@toolBtn').click();
            cy.get('.test-runner-scope .mask-container').as('areaMaskContainer');
            cy.get('@areaMaskContainer').find('.mask').as('areaMask');
            cy.get('@areaMask').should('be.visible');
            cy.get('@areaMask').find('.inner').as('inner');
            cy.get('@areaMask').find('.controls .close').as('closer');
            cy.get('@areaMask').find('.controls .view').as('viewer');

            // click close => destroy
            cy.get('@closer').click();
            cy.get('@areaMaskContainer').should('not.exist');
            // click tool => areaMask renders
            cy.get('@toolBtn').click();

            // look through
            cy.get('@viewer').click();
            cy.get('@areaMaskContainer').should('have.class', 'previewing');
            cy.get('@inner').should('have.css', 'opacity', '0.15');
            // un-look through
            // the component uses a default delay of 3000ms before restoring the mask
            cy.wait(3000);
            cy.get('@areaMaskContainer').should('not.have.class', 'previewing');
            cy.get('@inner').should('have.css', 'opacity', '1');

            // TODO: draggable
            // TODO: resizable

            // add multiple instances (max 5)
            cy.get('@toolBtn').click().click().click().click().click();
            cy.get('@areaMaskContainer').should('have.length', 5);

            // clean up
            cy.get('@closer').click({ multiple: true, force: true });
            cy.get('@areaMaskContainer').should('not.exist');
        });

        //Note: the magnifier is tested last, because it duplicates the DOM and can break other tests
        it('Has magnifier tool', function() {
            // plugin loaded?
            cy.get('.tools-box-list [data-control=magnify] a').as('toolBtn');
            cy.get('@toolBtn').should('be.visible');

            // click tool => magnifier renders
            cy.get('@toolBtn').click();
            cy.get('.runner > .magnifier-container').as('magnifierContainer');
            cy.get('@magnifierContainer').find('.magnifier').as('magnifier');
            cy.get('@magnifier').should('be.visible');
            cy.get('@magnifier').find('.inner').as('inner');
            cy.get('@magnifier').find('[data-control="zoomIn"]').as('zoomIn');
            cy.get('@magnifier').find('[data-control="zoomOut"]').as('zoomOut');
            cy.get('@magnifier').find('[data-control="closeMagnifier"]').as('closer');

            // click tool => hide
            cy.get('@toolBtn').click();
            cy.get('@magnifier').should('not.be.visible');
            // click tool => magnifier visible
            cy.get('@toolBtn').click();
            cy.get('@magnifier').should('be.visible');
            // click close => hide
            cy.get('@closer').click();
            cy.get('@magnifier').should('not.be.visible');
            // click tool => magnifier visible
            cy.get('@toolBtn').click();

            // contains inner item
            cy.get('@inner').find('.qti-itemBody').should('exist').and('be.visible');

            // initial transform scale applied (2x)
            cy.get('@inner').should('have.attr', 'style').and('contain', 'scale(2)');
            // zoom out (min zoom 2x)
            cy.get('@zoomOut').click();
            cy.get('@inner').should('have.attr', 'style').and('contain', 'scale(2)');
            // zoom in (scales in 0.5 incrs)
            cy.get('@zoomIn').click();
            cy.get('@inner').should('have.attr', 'style').and('contain', 'scale(2.5)');
            cy.get('@zoomIn').click();
            cy.get('@inner').should('have.attr', 'style').and('contain', 'scale(3)');
            // zoom out
            cy.get('@zoomOut').click();
            cy.get('@inner').should('have.attr', 'style').and('contain', 'scale(2.5)');
            // zoom in (max zoom 8x)
            cy.get('@zoomIn').click().click().click().click().click().click().click().click().click().click().click().click(); // now 8.5x
            cy.get('@inner').should('have.attr', 'style').and('contain', 'scale(8)');

            // TODO: draggable
            // TODO: resizable

            // close it
            cy.get('@toolBtn').click();
        });
    });
});
