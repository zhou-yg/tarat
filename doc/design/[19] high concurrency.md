# 高并发

为了应对高并发带来的对系统研发的挑战，服务端架构演进出了很多种不同的架构模式

分布式，微服务，service mesh等，针对解决不同的高并发问题：工程问题，系统问题

这是一种自下而上的架构演进体系，跟顶层的产品有关，但不是完全有关

对于这些架构而言，顶层的产品只负责提出问题，制作”冲突“场景，提供产品背景板

在这个背景下，工程师创建各种工程架构，抽象设计，然后反过来让这套抽象设计去match这个产品背景板

来源于产品，又为了软件工程本身的基本原则：可靠，可维护，可拓展，会做很多超”前“工作，最后又超脱于产品

希望这超脱出的部分，能完美 cover busness track

## 自上而下

前提得益于对产品的充分拆解，形成有效的，标准化结构化单元

在以driver为单元的产品结构里，有希望可以实现自上而下的，服务端架构体系
