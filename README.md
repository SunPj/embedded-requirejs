# What is it?
If you need to use some AMD modules that are directly embended in html page,this library is exactly that you are looking for

# Why don't just use almond (https://github.com/requirejs/almond)?
Almond is a great library, but sometimes you don't need to assemble js libraries, and you want to use them as they are. 
Using embedded-requirejs you don't have to do extra. This library is written for pedagogical reasons, so it may not contain certain functionality that requirejs does.

# How can I use it?
1. Add `embedded-requirejs` library to your to html header
```
<script src="embedded-require.js"></script>
```
2. Specify other libraries that you are going to use to html header
```
<script src="js/d3.min.js" onload="registerDependency(this);" data-name="d3"></script>
```
3. Add your app as last tag in html body
```
<script src="js/app.js"></script>
```
# Where should I ask questions?
You are welcome to create issues right in github
