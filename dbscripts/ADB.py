#!/usr/bin/python
"""
# ADB.py
#
# Functions to manage an AWARE database 
#
# This file is used to merge a heirarchy of json files used to track AWARE 
# Imaging System.
#
# Created by: Steve Feller on 11/8/2012
# Release Date:
#
# Modified:
#    1/22/2014 - Steve Feller - Added file system interface support
# versions: 0.2
#
# Functions:
#    generate(path)  - function to generate a dictionary of 
#                      the json data using the given path as
#                      the root.
#    writeDict(dest) - function to write the current dictionary
#                      to the specified file
#    query(key)      - function to get a list of all values for the given key
#    findKeys(value) - function to find a key that matches a given value
#
#    genDict(path)   - recursive function that step through
#                      subdirectories of the given path and 
#                      aggregates data into a single dictionary
#                      that is returned. 
#
#                       Any data that needs to be adjusted in handled within
#                     this function.
#
#    findKeys - recursive function to find keys for a given value
#    stringList(dbase) - iterative generate a list of strings for each value
#                     for each value in a dictionary. 
#
# Proposed functions:
#   writeDB - exports current dictionary to the the JSON file heirarchy
#
# Notes:
#   - need to add wildcard support to lookup functions (query, findkeys)
############################################################
"""
import os
import argparse
import json
import datetime

#custom files
import AJSON                                #JSON file interface functions
import MDB                                  #mongodb database interface class

from bson.objectid import ObjectId

############################################################
# Global variables
############################################################
VERBOSE = 0                                 #Debug level
mdb = None                                  #Database interface class
collection = None

"""
############################################################
# stringList( dbase)
#
# Function to generate a list of strings that show all fields 
# in a database. 
############################################################
"""
def stringList(dbase):
  files=list()
  
  #iterate through all keys
  for k, v in dbase.iteritems():
    
    #iterate query through all keys
    if type(v) is dict:
      for f in stringList(v):
        files.append(k+"/"+f)

    else:
      files.append(str(k)+":"+v)

  return files

"""
############################################################
# genKeys
#
# Function that recursively walks through dictionary and
# returns keys the given value
#
# Inputs:
#   dbase - database to query (local to function to be iterative)
#   val - value to query on
#
# Returns:
#   result - dictionary of all subsequent instances of value
############################################################
"""
def findKeys(dbase, val):
  global VERBOSE
  result={}
  
  #For each dictionary element, see if it has children
  for k, v in dbase.iteritems():
    if VERBOSE > 1:
      print "ADB.findKeys: Key: ",k," Value:",v
    
    #iterate query through all keys
    if type(v) is dict:
      value=findKeys(v, val)
      
      if len(value) > 0:
        #print "Result1:",k," value:",v
        result[k]=value
    
    if v == val:
      #print "Result:",k," value:",v
      result[k]=v
    
    if VERBOSE > 1:
      print "ADB.findKeys:result: ",result ," found", v," key:",k
  
  return result

"""
############################################################
# query
#
# Function that recursively walks through dictionary and
# returns sub values that contain the given key
#
# Inputs:
#   ldbase - database to query (local to function to be iterative)
#   key - key to query on
#
# Returns:
#   result - dictionary of all subsequent instances of value
#
# Notes: Eventually should include wildcards lookup options
#
############################################################
"""
def query(dbase, key):
  global VERBOSE
  result={}
  
  #For each dictionary element, see if it has children
  for k, v in dbase.iteritems():
    if VERBOSE > 1:
      print "ADB.query: key: ",k," Value:",v

    #iterate query through all keys
    if type(v) is dict:
      value=query(v, key)

      if len(value) > 0:
        #print "Result1:",k," value:",v
        result[k]=value

    if k == key:
      #print "Result:",k," value:",v
      result[k]=v
    
    if VERBOSE > 1:
      print "ADB.query:result: ",result ," found", k," Value:",v
  
  return result

"""
############################################################
# insert 
#
# Function that inserts the contenst of a JSON into the specified
# database. The collection type must be specified in the JSON file
# and must be one listed below. The collection name is a the plural
# fo the type (i.e. componet => components). This function assumes
# all json files have an unique id.
#
# Supported types:
#   dataset - dataset of raw images saved from camera
#   composite - stitched image for display
#   part      - part for component assembly
#   component - specific components in the system
#   model     - image formation model used
#   
# Inputs:
#   path - directory path to start generating data
#  
# Returns (dictionary):
#   "rc" - return code
#           1 = success
#          -1 = File does not exist
#          -2 = JSON file type not supported
#          -3 = Record already exists in directory
#          -4 = No ID field found
#
# Comments:
#   
############################################################
"""
def insert(dname, filename):
  global VERBOSE

  if VERBOSE > 1:
     print "DEBUG: insert("+str(dbase)+","+filename+")"

  if VERBOSE > 0:
     print "Reading "+str(filename)

  #read JSON file 
  retval = AJSON.readJson(filename)
  if VERBOSE > 1:
    print "Name:",jname," =>",retval

  #if json file exists, add to dictionary
  if retval["rc"] != 1:
    print "Unable to read JSON file. Return value: "+retval["rc"]
    return -1
  
  #File has been read and is 
  else:
    node = retval["data"]

    #add node to database
    if VERBOSE > 0:
      print "Inserting:"+str(node)
 
    #determine which collection the file belongs to
    #sdf - make sure type k,v pair exists to write to the correct collection
    #this is also where we would ensure the required fields are present in the JSON files
    if "type" in node.keys():
      if node["type"]=="dataset":
         collection="datasets"
      elif node["type"]=="composite":
         collection="composites"
      elif node["type"]=="model":
         collection="models"
      elif node["type"]=="part":
         collection="parts"
      elif node["type"]=="component":
         collection="components"
      else:
         if VERBOSE > 0:
            print "Type not currently supported"
            return -2

      #open the specified dictionary
      mdb = MDB.MDB(dname)

      #make sure record does not currently exist
      q={"id":node["id"]}
      if not  mdb.query(collection, q):
         if VERBOSE > 1:
            print "Record "+str(node["id"])+": is ready to insert in "+collection

         #remove type
         del node["type"]

         #insert new data and return
         mdb.insert(collection, node)
         return 1

      #skip entry if record exists
      else:
         if VERBOSE > 0:
            print "Record Exists in "+collection+":"+str(node["id"])
            return -3
         
    #throw error if invalid id
    else:
      if VERBOSE > 0:
         print "No id field found: "+path
      return -4


"""
############################################################
# recurse
#
# Function that recursively adds JSON files from 
# a given root-level path.
#
# Inputs
#   - dbase   - name of database to reference
#   - path    - initial path to start processing
#   - command - what function to perform (currently only insert is implemented)
############################################################
"""
def recurse(dbase, path, command):
  #count number of valid records added
  count = 0

  #check if valid path (need more debugging)
  if path[-1] == '/':
    dirname=os.path.basename(path[:-1])
  else:
    dirname=os.path.basename(path)
    path=path+'/'


  #######################################
  # Check if JSON file exists. If it exists
  # insert into the database
  #######################################
  for files in os.listdir(path):
    if files.endswith(".json"):
       jname=path+files

       if VERBOSE > 1:
          print "JSON Filename:",jname

       if command == "insert":
          rc = insert(dbase, jname) 
        
          if rc > 1:
             count = count + 1

  #######################################
  # Walk through subdirectories to ensure we get all files
  #######################################
  #Walk through subdirectories and recursively pull dictionaries from their content
  #get list of subdirs
  pathList = os.walk(path).next()[1]
 
  if VERBOSE > 1:
    print "Pathlist: ",pathList

  #recurse through each to get a list of children
  for child in pathList:
    #generate pathname for child and do recursive call
    cpath = path+child
    cpath.strip()
    if VERBOSE > 1:
      print  "ChildPath: ",cpath

    #recursively call this function. zoom and tiles indicate zoomify and
    #krpano heirarchical images.
    if not "zoom" in path and not "tiles" in path:
      rc = recurse(dbase, cpath, command)

  return count


"""
############################################################
# writeDict
#
# Function to write out the dictionary to a specified file. 
#
# Inputs:
#   path - directory path to start generating data
#  
# Returns (dictionary):
#   "rc" - return code matches AJSON.writeJson
#
# Notes:
#   sdf - need to improve argument parsing (no inputs variable)
#   sdf - need to add support for server/port
#   sdf - need to add error checking
############################################################
"""
def writeDict(dbase, dest):
  rc = AJSON.writeJson(dest, dbase, True)
  return rc


"""
############################################################
# Main function
############################################################
"""
def main(): 
  global VERBOSE
  global mdb
  global collection
  
  #parse inputs
  # parse command line arguments
  parser = argparse.ArgumentParser(description='AWARE Database Script')

  parser.add_argument('-v', action='store_const', dest='VERBOSE', const='True', help='VERBOSE output')
  parser.add_argument('-vv', action='store_const', dest='VERBOSE2', const='True', help='VERBOSE output')
  parser.add_argument('-p', action='store_const', dest='printout', const='True', help='print contents of JSON file')
  parser.add_argument('-d', action='store', dest='path', help='path to data')
  parser.add_argument('-f', action='store', dest='fname', help='filename to insert')
  parser.add_argument('-i', action='store_const', dest='insert', const='True', help='Add records to the given dictionary.')
  parser.add_argument('-r', action='store_const', dest='recurse', const='True', help='recursively add JSON files to the dictionary')
  parser.add_argument('-c', action='store', dest='collection', help='collection (table) to use')
  parser.add_argument('dbase', help='database name')

  args=parser.parse_args()

  #set VERBOSE flag as requested
  if args.VERBOSE:
    VERBOSE=1
  
  if args.VERBOSE2:
    VERBOSE=2
    print "VERBOSE=2"

  #extract relevant parameters
  if VERBOSE > 1:
     print "Using database "+args.dbase
  
  #We are inserting records. Check if recursing directories or not
  if args.insert:
     if args.fname:
        rc = insert(str(args.dbase), str(args.fname))
     
     elif args.path:
        if args.recurse:
          recurse(args.dbase, str(args.path), "insert")

  else:
    print "Currently only insert capability is supported"   

"""
############################################################
#Function to validate peformance
############################################################
"""
if __name__ == '__main__':
  main()

