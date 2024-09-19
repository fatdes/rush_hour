#!/bin/sh

migrate -path=/migration/ -database=postgres://postgres:5432/rush_hour\?user=rush\&password=hour\&sslmode=disable drop -f

migrate -path=/migration/ -database=postgres://postgres:5432/rush_hour\?user=rush\&password=hour\&sslmode=disable up
