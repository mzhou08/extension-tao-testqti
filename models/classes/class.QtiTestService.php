<?php


/*
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
* Copyright (c) 2008-2010 (original work) Deutsche Institut für Internationale Pädagogische Forschung (under the project TAO-TRANSFER);
*               2009-2012 (update and modification) Public Research Centre Henri Tudor (under the project TAO-SUSTAIN & TAO-DEV);
*
*/

require_once dirname(__FILE__) . '/../../lib/qtism/qtism.php';

use qtism\data\storage\StorageException;
use qtism\data\storage\xml\XmlAssessmentItemDocument;
use qtism\data\AssessmentItemRef;
use qtism\data\SectionPartCollection;
use qtism\data\storage\xml\XmlAssessmentTestDocument;

/**
 * the QTI TestModel service
 *
 * @access public
 * @author Joel Bout, <joel.bout@tudor.lu>
 * @package taoQtiTest
 * @subpackage models_classes
 */
class taoQtiTest_models_classes_QtiTestService extends tao_models_classes_Service
{

    const CONFIG_QTITEST_FOLDER = 'qtiTestFolder';
    
    /**
     * Get the items that are part of a given $test.
     * 
     * @param core_kernel_classes_Resource $test A Resource describing a QTI Assessment Test.
     * @return array An array of core_kernel_classes_Resource objects.
     */
    public function getItems( core_kernel_classes_Resource $test) {
    	$file = $test->getOnePropertyValue(new core_kernel_classes_Property(TEST_TESTCONTENT_PROP));
    	
    	if (is_null($file)) {
    	    $file = $this->createContent($test);
    	}
		else {
			$file = new core_kernel_file_File($file);
		}
        
    	$doc = new XmlAssessmentTestDocument('2.1');
    	$doc->load($file->getAbsolutePath());
    	
    	$itemArray = array();
    	foreach ($doc->getComponentsByClassName('assessmentItemRef') as $itemRef) {
    		$itemArray[] = new core_kernel_classes_Resource($itemRef->getHref());
    	}
    	
    	return $itemArray;
    }

    /**
     * Set the items that are part of a given $test.
     * 
     * @param core_kernel_classes_Resource $test A Resource describing a QTI Assessment Test.
     * @param array $items
     * @return boolean
     * @throws StorageException If an error occurs while serializing/unserializing QTI-XML content. 
     */
    public function setItems( core_kernel_classes_Resource $test, array $items) {
        $file = $test->getOnePropertyValue(new core_kernel_classes_Property(TEST_TESTCONTENT_PROP));
       	$file = (is_null($file)) ? $this->createContent($test) : new core_kernel_file_File($file); 
    	
		try {
			$doc = new XmlAssessmentTestDocument('2.1');
			$testPath = $file->getAbsolutePath();
			
			try {
				$doc->load($testPath);
			}
			catch (StorageException $e) {
				$msg = "An error occured while loading QTI-XML test file '${testPath}'.";
				throw new taoQtiTest_models_classes_QtiTestServiceException($msg, 3);
			}
			
			$section = $doc->getComponentByIdentifier('assessmentSectionId');
			 
			$itemContentProperty = new core_kernel_classes_Property(TAO_ITEM_CONTENT_PROPERTY);
			$itemRefs = new SectionPartCollection();
			 
			foreach ($items as $itemResource) {
				$itemContent = $itemResource->getUniquePropertyValue($itemContentProperty);
				$itemContent = new core_kernel_file_File($itemContent);
			
				$itemDoc = new XmlAssessmentItemDocument();
				
				try {
					$itemDoc->load($itemContent->getAbsolutePath());
				}
				catch (StorageException $e) {
					$itemUri = $itemResource->getUri();
					$msg = "An error occured while reading QTI-XML item '${itemUri}'.";
					
					if (is_null($e->getPrevious()) !== true) {
					    $msg .= ": " . $e->getPrevious()->getMessage();
					}
					
					throw new taoQtiTest_models_classes_QtiTestServiceException($msg, 1);
				}
			
				$itemRefs[] = new AssessmentItemRef($itemDoc->getIdentifier(), $itemResource->getUri());
				$section->setSectionParts($itemRefs);
			}
			
			try {
				$doc->save($testPath);
			}
			catch (StorageException $e) {
				$msg = "An error occured while writing QTI-XML test '${testPath}'.";
				throw new taoQtiTest_models_classes_QtiTestServiceException($msg, 2);
			}
		}
    	catch (StorageException $e) {
    		$msg = "An error occured while dealing with the QTI-XML test.";
    		throw new taoQtiTest_models_classes_QtiTestServiceException($msg, 0);
    	}
    	
    	return true;
    }
    
    private function createContent( core_kernel_classes_Resource $test) {
    	common_Logger::i('CREATE CONTENT');
    	$props = self::getQtiTestDirectory()->getPropertiesValues(array(
				PROPERTY_FILE_FILESYSTEM,
				PROPERTY_FILE_FILEPATH
			));
		$repository = new core_kernel_versioning_Repository(current($props[PROPERTY_FILE_FILESYSTEM]));
		$path = (string)current($props[PROPERTY_FILE_FILEPATH]);
		$file = $repository->createFile(md5($test->getUri()).'.xml', $path);
		$ext = common_ext_ExtensionsManager::singleton()->getExtensionById('taoQtiTest');
		$emptyTestXml = file_get_contents($ext->getDir().'models'.DIRECTORY_SEPARATOR.'templates'.DIRECTORY_SEPARATOR.'qtiTest.xml');
		$file->setContent($emptyTestXml);
		common_Logger::i('Created '.$file->getAbsolutePath());
		$test->setPropertyValue(new core_kernel_classes_Property(TEST_TESTCONTENT_PROP), $file);
		return $file;
    }
    
    public function deleteContent( core_kernel_classes_Resource $test) {
        $content = $test->getOnePropertyValue(new core_kernel_classes_Property(TEST_TESTCONTENT_PROP));
    	if (!is_null($content)) {
			$file = new core_kernel_file_File($content);
    		if(file_exists($file->getAbsolutePath())){
	        	if (!@unlink($file->getAbsolutePath())){
	        		throw new common_exception_Error('Unable to remove the file '.$file->getAbsolutePath());
	        	}
    		}
			$file->delete();
			$test->removePropertyValue(new core_kernel_classes_Property(TEST_TESTCONTENT_PROP), $file);
    	}
    }
    
    public function setQtiTestDirectory(core_kernel_file_File $folder) {
    	$ext = common_ext_ExtensionsManager::singleton()->getExtensionById('taoQtiTest');
    	$ext->setConfig(self::CONFIG_QTITEST_FOLDER, $folder->getUri());
    }
    
    public function getQtiTestDirectory() {
    	
    	$ext = common_ext_ExtensionsManager::singleton()->getExtensionById('taoQtiTest');
        $uri = $ext->getConfig(self::CONFIG_QTITEST_FOLDER);
        if (empty($uri)) {
        	throw new common_Exception('No default repository defined for uploaded files storage.');
        }
		return new core_kernel_file_File($uri);
	}
}

?>