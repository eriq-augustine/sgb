#!/bin/sh

export GOPATH=$GOPATH:`pwd`:`pwd`/vendor

go install com/eriqaugustine/sgb
