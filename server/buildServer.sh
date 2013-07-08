#!/bin/sh

export GOPATH=$GOPATH:`pwd`:`pwd`/vendor

echo $GOPATH

go install com/eriqaugustine/spf
