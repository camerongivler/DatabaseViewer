#!/usr/bin/python
"""
###########################################################
# AJSON.py
# 
# AWARE json file interface code
#
# This file supports JSON file I/O. The output is assumed to
# be a dictionary. It is a base class for the ADBASE application
#
# Functions:
#   insertJson - insert data into an existing JSON file
#   readJson - read JSON file into a dictionary
#   writeJson - write dictionary to a JSON file
#   printJson - print dictionary to console in a JSON format
#
# Based on code developed by Sally Gewalt
# Modified by Steve Feller on 11/8/12
# Released on:
###########################################################
"""
import os                                   #file I/O Support
import argparse                             #command line arguments
import json                                 #JSON libraries

VERBOSE=0                                   #DEBUG level

"""
#############################################
# insertJson
#
# Function to insert a record into a JSON file
#
# 
# Inputs: 
#   name  - name file to read
#   key   - key to insert
#   value - value to insert
# Return codes:
#   1 - Normal Exist
#   0 - File does not exist
#  -1 - Filename is not initalizated
#  -2 - File could not be openeded
#  -3 - Field already exists
#  -4 - File could not be saved
#############################################
"""
def insertJson(name, key, value):
   ret = readJson(name)

   #If unable to read, return error
   if ret["rc"] != 1:
      return ret

   #insert record
   data=ret["data"]
   data[key]=value

   #write final output
   ret = writeJson(name, data, True)

   return ret
   
"""
#############################################
# readJson
#
# This function reads a json file into the global data dictionary
#
# Inputs: name - name of file to read
# Return Codes:
#    1 Normal exit
#    0 File does not exist
#   -1 Name is not defined
#   -2 File could not be opened
#############################################
"""
def readJson(name):
  #verify that the filename has been set
  if name is None:
    if VERBOSE > 0:
      print "Name not defined"
    return {"rc":-1}

  #if file does not exist, use current database (empty)
  if not os.path.isfile(name):
    if VERBOSE > 1:
      print "readFile: ",name," does not exist, creating empty dictionary"
    return {"rc":0}
  else:
    #open specified filename
    try:
      fptr = open(name)
    except(Exception, IOError), e:
      if VERBOSE > 0:
        print 'readFile: Could not open %s: %s'%(name,e)
      return {"rc":-2} 

    #read data from json file
    data = json.load(fptr)
    
    #close file pointer
    fptr.close();

  return {"rc":1,"data":data}

"""
#############################################
# writeJson
#
# This function reads a json file into the global data dictionary.
# The force flag is used to prevent accidental overwritting fo files.
#
# Inputs: 
#   name - filename to write to
#   data - Dictionary to print
#   force - flag that allows overwrite if True
#
# Return Codes:
#    1 Normal exit
#   -1 Name is not defined
#   -2 File exists, overwrite not enabled
#   -3 File could not be opened
#############################################
"""
def writeJson(name, data, force):
  #verify that the filename has been set
  if name is None:
    if VERBOSE > 0:
      print "write: Name not defined"
    return -1

  if os.path.isfile(name)and force==False:
    if VERBOSE > 0:
      print "cannot overwrite existing", name
    return -2 
  else:
    try:
      fptr = open(name, "w")
      fptr.write(json.dumps(data, indent=2, sort_keys=True)) # sort or arb order
    except(IOError), e:
      if VERBOSE > 0:
        print 'write: Could not write destination %s: %s'%(json_mfile,e)
      return -3
  return 1

"""
#############################################
# printJson
#
# Function to print a json file. It's here for 
# convenience since it's a one-line function.
#############################################
"""
def printJson( dbase ):
  print json.dumps(dbase, indent=4)
  return 1
"""
############################################################
# main
# 
# Command line function for interfacing with python data 
############################################################
"""
def main():

  # parse command line arguments
  parser = argparse.ArgumentParser(description='AWARE json file parser')

  parser.add_argument('-v', action='store_const', dest='VERBOSE', const='True', help='VERBOSE output')
  parser.add_argument('-vv', action='store_const', dest='VERBOSE2', const='True', help='VERBOSE output')
  parser.add_argument('-p', action='store_const', dest='printout', const='True', help='print contents of JSON file')
  parser.add_argument('-c', action='store_const', dest='create', const='True', help='print contents of JSON file')
  parser.add_argument('-w', action='store_const', dest='write', const='True', help='write JSON file')
  parser.add_argument('-f', action='store_const', dest='force', const='True',  help='output file')
  parser.add_argument('-o', action='store', dest='outfile', help='output file')
  parser.add_argument('-i', action='store_const', dest='insert', const='True', help='output file')
  parser.add_argument('-key', action='store', dest='key', help='output file')
  parser.add_argument('-value', action='store', dest='value', help='output file')
  parser.add_argument('filename', nargs='+', help='filename')

  args=parser.parse_args()

  #set debug level
  VERBOSE=0
  if args.VERBOSE:
    VERBOSE=1
  if args.VERBOSE2:
    VERBOSE=2

  #Check if we're creating the file, add key and value to dictionary
  if args.create:
    if VERBOSE > 0:
      print "Creating "+str(args.filename)+" with "+str(args.key)+":"+str(args.value)
    if( os.path.isfile(args.filename[0])):
      print "File exists, unable to create!"
      return -1
    else:
      data = {}

      if args.key and args.value:
        try:
          data[args.key] = int(args.value)
        except:
          try:
            data[args.key] = float(args.value)
          except:
            data[args.key] = args.value

        writeJson(args.filename[0], data, True)
      else:
        print "Must include key and value arguments to inserts"
        return 1

  #if insert option, extract the key and value
  if args.insert:
    if VERBOSE > 0:
      print "Inserting "+str(args.key)+":"+str(args.value)+" into "+str(args.filename[0])

    #check for key and value
    if args.key and args.value:
      try:
        insertJson(args.filename[0], args.key, int(args.value))
      except:
        try:
          insertJson(args.filename[0], args.key, float(args.value))
        except:
          insertJson(args.filename[0], args.key, args.value)
    else:
      print "Must include key and value arguments to inserts"
      return 1

  #read in file 
  data = readJson(args.filename[0])

  #if printout
  if args.printout:
    print json.dumps(data, indent=4)

  #write file
  if args.write:
    #if force, set force
    force = False
    if args.force:
      force = True

    #if outfile set, change name
    if args.outfile:
      fname=args.outfile
    else:
      fname=arg.filename[0]

    #write file
    writeJson(fname,data, force)


  
"""
############################################################
# Namespace validation
############################################################
"""
if __name__ == "__main__":
  main()

