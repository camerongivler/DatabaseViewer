#!/usr/bin/python
"""
############################################################
# MDB.py
#
# Database interface class for access to the AWARE MongoDB 
# database that tracks user information and other data.
#
# Developed by: Steve Feller
# Date: 12/27/12
############################################################
"""
import sys
import argparse
import pymongo
from pymongo import MongoClient
from pymongo import ASCENDING, DESCENDING

import json
import AJSON
import ADB



class MDB:
   """Interface to a MongoDB Database."""  
   
   #class variables
   connection = ""
   db = ""
#   db = "aware" 

   
   #############################################
   # Initialization function 
   #
   # Inputs:
   #   host - hostname of mongoDB server 
   #   port - port for mongoDB server
   #   dbase - database name
   #
   # Returns:
   #   1 - OK
   # 
   # Notes: 
   #   - needs additional error checking
   ############################################
   def __init__(self, dbase, host='none', port='none' ):
      global connection
#   def __init__(self, dbase ):
      """Intialization Function"""
      self.db = dbase

      print "Initializing: "+dbase
      
      #establich connection 
      if host != 'none' and port != 'none':
         connection = MongoClient(host,port)
      else:
         connection = MongoClient()

      #link database
      self.db = connection[str(dbase)]
  

      return


   #############################################
   # Insert Document 
   #
   # Inputs:
   #   data - dictionary to be inserted in database 
   #
   # Returns:
   #   rc - number of inserted documents
   #############################################
   def insert(self, collection, data):
      """Insert a document into the database """

      #specify collection
      coll = self.db[collection]

      try :
         coll.insert(data)
      except:
         e = sys.exc_info()[0]
         print "Error: "+ str(e)
         return -1;

      return 1

   #############################################
   # Query Document
   #
   # Inputs: 
   #   coll - collection to query
   #   data - {key:value} dictionary to search for
   #   action - option on data process
   #      'count' - returns number of elements found
   #   'sort = key'  - sorts the results by given key
   #
   # Returns:
   #   result - list of returned values
   #############################################
   def query(self, coll, data, action='none', sort='none'):
      """ Query a document from the database """
      posts = self.db[coll]

      #count strings
      if action == 'count':
         return posts.find(data).count()

      #find all matching posts
      result = []

      if sort == 'none':
         for post in posts.find(data):
            result.append(post)
      else:
         for post in posts.find(data).sort(sort):
            result.append(post)

      return result
   
   #############################################
   # Dump Database
   #############################################
   def dump(self, action='none'):
      """Get all documents in a database """
      posts = self.db.posts

      #count strings
      if action == 'count':
         return posts.count()

      #return list
      result = []
      for post in posts.find():
         result.append(post)

      return result

"""
############################################################
# Main()
#
# Main function for testing. Interface for command line as
# well as python shell
############################################################
"""
def main():
   """ Main function for testing the class """
   VERBOSE = 0
   host=""
   port=-1

   parser = argparse.ArgumentParser(description="MDB AWARE Datbase interface")

   parser.add_argument('-v', action='store_const', dest='VERBOSE', const='True', help='VERBOSE output')
   parser.add_argument('-vv', action='store_const', dest='VERBOSE2', const='True', help='VERBOSE output')
   parser.add_argument('-s', action='store', dest='host', help='hostname of mongodb server')
   parser.add_argument('-p', action='store', dest='port', help='port of the mongodb server')
   parser.add_argument('-a', action='store', dest='add', help='add specified file into dictionary')
   parser.add_argument('-q', action='store', dest='query', help='query speficied key pair')
   parser.add_argument('-d', action='store_const', dest='dump', const='True', help='query speficied key pair')
   parser.add_argument('-c', action='store_const', dest='action', const='count', help='query speficied key pair')
   parser.add_argument('-o', action='store', dest='outfile', help='output file')
   parser.add_argument('dbase', help='database to reference')

   args=parser.parse_args()

   #set verbosity level
   if args.VERBOSE:
      VERBOSE = 1

   if args.VERBOSE2:
      VERBOSE = 2

   #Use command line data to set host and port
   #sdf - needs to be checked
   if args.host != "" and args.port != -1:
      mdb = MDB(args.dbase, args.host, args.port)
   else:
      mdb = MDB(args.dbase)

   if VERBOSE > 0:
     print "Using "+args.dbase+" as the database"


   #add specified file to the database
   if args.add:
  
      if VERBOSE > 0:
         print "Reading :"+args.add

      #load JSON file
      data = AJSON.readJson(args.add)
 
      print "Should add data here"
      mdb.insert(collection,data)

   #query database
   if args.query:
      if VERBOSE > 0:
         print "Query: "+args.query
 
      mdb.query(args.query)

   #dump database
   if args.dump:
      if VERBOSE > 0:
         print "Dumping..."

      if args.action:
         rc = mdb.dump(action=args.action)
         print "Count: "+str(rc)

      else:
         rc = mdb.dump()

         for item in rc:
            print str(item)+"\n"

   
"""
############################################################
# Map __main__ to main()
############################################################
"""
if __name__ == "__main__":
   sys.exit(main())



