#!/bin/bash
#############################################
# jsoncheck
#
# Function to recursively validate all json files
# from a given root directory
#
# Created by: Steve Feller 
#
# Last modified:
#   11/15/12 - sdf - prints name of broken files
#
# This file is a hack. Please treat it appropriately!
#############################################
count=0
fail=0

path=$1

home=`pwd`

cd $path

#find all json files (assumes .json is only json type)
res=`find * |grep json |grep -v sw`

#loop through file list. Increment count for each file
#and fail for each file with an error. Print name of 
#file that fails
for file in $res
do
  count=$(($count+1))
  cat $file | python -m simplejson.tool > /dev/null
  result=$?

  #A result of 0 means normal exit and everything OK. If
  #not, then failure!
  if [ $result -ne 0 ]
  then
    echo $file failed
    fail=$(($fail+1))
  fi
done

#print results on completion
echo "$fail of $count files is/are not valid"

cd $home
