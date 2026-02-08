# CSEP-561 Lecture Slides: Bandwidth Allocation & Congestion Control

## Slide 1
Last thoughts on SDN 
for a while…
5/2/2022 UW CSEP -561 1

## Slide 2
Concisely define SDN one cannot
•SDN is more of a philosophy 
than a specific technique
•Big idea:
•Disaggregate control logic 
from specific hardware
•Driving changes in industry 
power dynamics
•Switches/Routers no longer 
expensive monoliths
5/2/2022 UW CSEP -561 2

## Slide 3
Philosophical Shift
•Classical routing and networking:
•Establishing protocols between independent entities where desired 
behaviors are emergent
5/2/2022 UW CSEP -561 3

## Slide 4
Philosophical Shift
•SDN:
•programming the network to achieve desired behaviors as a system
5/2/2022 UW CSEP -561 4

## Slide 5
Network Model Abstractions
•Clients say which hosts should 
be connected into which 
named networks
•Controller figures out details 
to implement over the net 
graph
•Optimize placements, routing
•Apply security policies
•Export updated graph as rule 
updates in switches
5/2/2022 UW CSEP -561 5Named hosts and 
networksNamed hosts and 
networksNamed hosts, 
networks, policies
Routing Information Base (RIB)
Consistent graph of connections
Forwarding Information Base (FIB)
Specific rules on each switchForwarding Information Base (FIB)
Specific rules on each switchForwarding Information Base (FIB)
Specific rules on each switchApplications
Control Plane
Data Plane

## Slide 6
SDN and Automation
•SDN abstraction allows for managing complexity with 
automation
•Can build reliable and testable translation from network 
model to deployed network
•Output specific finely -tuned configs for physical network that 
humans could not reason about without machine help
5/2/2022 UW CSEP -561 6

## Slide 7
Where we are in the Course
Today: We’ve built networks… now let’s actually move data over them!
•Moving up the stack to the transport layer!
5/2/2022 UW CSEP -561 7PhysicalLinkNetworkTransportApplication“end-to-end” 
connectivity across 
networks of 
networks

## Slide 8
The Transport Layer!
Common protocols: TCP + UDP
5/2/2022 UW CSEP -561 8

## Slide 9
Abstraction:
•Transport layer provides “end -to-end” connectivity across 
networks of networks
5/2/2022 UW CSEP -561 9Router Host HostTCP
IP
802.11app
IP
802.11IP
EthernetTCP
IP
EthernetappQ: What did end -to-end mean again, and why 
was it an important idea?

## Slide 10
Some vocabulary…
•Segments carry application data across the network
•Segments are carried within packets within frames
•In modern SDN/programmable switches, the distinction is less 
meaningful, so people often use “packet” to refer to any one of 
these things…
5/2/2022 UW CSEP -561 10802.11 IP TCP App, e.g., HTTPSegment
Packet
Frame

## Slide 11
Transport Layer Services
•Different transports provide different kinds of data delivery 
across the network to applications
5/2/2022 UW CSEP -561 11Unreliable Reliable
Messages Datagrams (UDP) Chunks (SCTP)
Bytestream Streams (RTP) Streams (TCP)

## Slide 12
Comparison of Internet Transports
•TCP is full -featured, UDP is a glorified packet
5/2/2022 UW CSEP -561 12TCP (Streams) UDP (Datagrams)
Connections Datagrams
Bytes are delivered once, 
reliably, and in orderMessages may be lost, 
reordered, duplicated
Arbitrary length content Limited message size
Flow control matches sender 
to receiverCan send regardless
of receiver state
Congestion control matches 
sender to networkCan send regardless
of network state

## Slide 13
Socket API
•Simple abstraction to use the network offered by OS
•The “network” API (really Transport service) used to write most 
Internet apps
•Part of all major OSes and languages; 
originally Berkeley (Unix) ~1983
•Supports many types of Internet transport services
•(Streams, Chunks, and Datagrams)
5/2/2022 UW CSEP -561 13

## Slide 14
Socket API (2)
•Sockets let apps attach to the local network at different ports
•Multiple apps on one host at the same time
5/2/2022 UW CSEP -561 14
Socket,
Port #1Socket,
Port #2

## Slide 15
Socket API (3)
•Same API used for Streams and Datagrams
5/2/2022 UW CSEP -561 15Primitive Meaning
SOCKET Create a new communication endpoint
BIND Associate a local address (port) with a socket
LISTEN Announce willingness to accept connections to OS
ACCEPT Passively establish an incoming connection
CONNECT Actively attempt to establish a connection
SEND([TO]) Send some data over the socket
RECEIVE([FROM]) Receive some data over the socket
CLOSE Release the socketOnly needed 
for Streams
To/From for 
Datagrams

## Slide 16
Ports
•Application process is identified by the “5 -tuple” IP address 
src/dst, transport protocol, and port src/dst
•Ports are 16 -bit integers representing local “mailboxes” that a 
process leases
•Servers often bind to “well -known ports”
•<1024, require administrative privileges
•Clients often assigned “ephemeral” ports
•Chosen by OS, used temporarily 
5/2/2022 UW CSEP -561 16

## Slide 17
Some Well -Known Ports
5/2/2022 UW CSEP -561 17Port Protocol Use
20, 21 FTP File transfer
22SSH Remote login, replacement for Telnet
25SMTP Email
80HTTP World Wide Web
110 POP -3 Remote email access
143 IMAP Remote email access
443 HTTPS Secure Web (HTTP over SSL/TLS)
543 RTSP Media player control
631 IPP Printer sharing

## Slide 18
UDP
5/2/2022 UW CSEP -561 18

## Slide 19
User Datagram Protocol (UDP)
•Used by apps that don’t want reliability or bytestreams
•Like what?
5/2/2022 UW CSEP -561 19

## Slide 20
User Datagram Protocol (UDP)
•Used by apps that don’t want reliability or bytestreams
•Voice -over -IP 
•DNS, RPC 
•DHCP
•Application can implement its own reliability if needed
5/2/2022 UW CSEP -561 20

## Slide 21
Datagram Sockets
5/2/2022 UW CSEP -561 21Client (host 1) Server (host 2)
Time
request
reply

## Slide 22
Datagram Sockets
5/2/2022 UW CSEP -561 22Client (host 1) Server (host 2)
Time
request
reply1: socket2: bind1: socket
4: sendto3: recvfrom * 2: sendto
3: recvfrom *
4: close 5: close
*= calls block

## Slide 23
UDP Buffering
5/2/2022 UW CSEP -561 23App
Port Mux/DemuxApp AppApplication
Transport
(UDP)
Network (IP) packetMessage queuesPorts

## Slide 24
UDP Header (it’s really that simple)
•Uses ports to identify sending and receiving application 
processes
•Datagram length up to 64K
•(optional) Checksum (16 bits) for “reliability”
5/2/2022 UW CSEP -561 24Source Port Destination Port
Length Checksum32 Bits

## Slide 25
Aside: 
Middleboxes /NAT and transport innovation…
•Remember NAT from last class?
•Inspecting and modifying transport -layer port numbers to allow 
address reuse seemed like a good idea in the 90s and early 2000s…
•Side effect that now millions of devices are in the network 
with knowledge of only a few legacy transports : /
•Part of the reason why you don’t see much SCTP in practice!
•Even if more appropriate for many workloads than TCP 😥
5/2/2022 UW CSEP -561 25

## Slide 26
Working around middleboxes…
•We’re stuck with it now, so many new protocols are built on 
top of UDP rather than on IP directly
•Only 8 bytes of overhead, and you probably wanted port numbers 
anyway 🤷‍♀️
•SCTP over UDP ( RFC6951 ) for example
•QUIC (Quick UDP Internet Connections) takes an even more 
aggressive stance …
•Encrypts connection metadata so middleboxes cannot come to rely 
on information!
•Partly for security + privacy, but partly so protocol can stay agile!
5/2/2022 UW CSEP -561 26

## Slide 27
TCP
The workhorse transport… integra lpart of TCP/IP before IP split off!
5/2/2022 UW CSEP -561 27

## Slide 28
TCP
•Connection -oriented reliable bytestream service
•TCP Consists of 3 primary phases:
1.Connection Establishment (Setup)
2.Sliding Windows/Flow Control
3.Connection Release (Teardown)
5/2/2022 UW CSEP -561 28

## Slide 29
TCP Signaling
Connection Establishment & Release
5/2/2022 UW CSEP -561 29

## Slide 30
Connection Establishment
•Both sender and receiver must be ready before we start the 
transfer of data
•Need to agree on a set of parameters
•e.g., the Maximum Segment Size (MSS)
•This is signaling
•It sets up state at the endpoints
•Like “dialing” for a telephone call
5/2/2022 UW CSEP -561 30

## Slide 31
31Three -Way Handshake
•Used in TCP; opens connection for 
data in both directions
•Each side probes the other with a 
fresh Initial Sequence Number (ISN)
•Sends on a SYNchronize segment
•Echo on an ACKnowledge segment
•Chosen to be robust even against 
delayed duplicatesActive party
(client)Passive party
(server)
5/2/2022 UW CSEP -561 31

## Slide 32
32Three -Way Handshake (2)
•Three steps:
•Client sends SYN(x)
•Server replies with SYN(y)ACK(x+1)
•Client replies with ACK(y+1)
•SYNs are retransmitted if lost
•Sequence and ack numbers carried 
on further segments1
2
3Active party
(client)Passive party
(server)
Time
5/2/2022 UW CSEP -561 32

## Slide 33
TCP Connection State Machine
•Captures the states ([]) and transitions ( ->)
•A/B means event A triggers the transition, with action B
Both parties 
run instances 
of this state 
machine
5/2/2022 UW CSEP -561 33

## Slide 34
TCP Connections (2)
•Follow the path of the client: 
5/2/2022 UW CSEP -561 34

## Slide 35
TCP Connections (3)
•And the path of the server: 
5/2/2022 UW CSEP -561 35

## Slide 36
TCP Connections (2)
•Again, with states …
36LISTEN
SYN_RCVDSYN_SENT
ESTABLISHED
ESTABLISHED1
2
3Active party (client) Passive party (server)
TimeCLOSED CLOSED
5/2/2022 UW CSEP -561 36

## Slide 37
TCP Connections (3)
•Finite state machines are a useful tool to specify and 
check the handling of all cases that may occur
•This feels like classic distributed systems : )
•Aside: TCP allows for simultaneous open
•i.e., both sides open instead of the client -server pattern
•Nice forfaster establishment of additional connections
37
5/2/2022 UW CSEP -561 37

## Slide 38
Connection Release
•Orderly release by both parties when done
•Delivers all pending data and “hangs up”
•Cleans up state in sender and receiver
•Key problem is to provide reliability while releasing
•TCP uses a “symmetric” close in which both sides shutdown 
independently
5/2/2022 UW CSEP -561 38

## Slide 39
39TCP Connection Release
•Two steps:
•Active sends FIN(x), passive ACKs
•Passive sends FIN(y), active ACKs
•FINs are retransmitted if lost
•Each FIN/ACK closes one direction 
of data transferActive 
partyPassive party
1
2
5/2/2022 UW CSEP -561 39

## Slide 40
TCP Connection State Machine
40Both parties 
run instances 
of this state 
machine
•Captures the 
states ([]) and 
transitions ( ->)
•A/B means 
event A triggers 
the transition, 
with action B
5/2/2022 UW CSEP -561 40

## Slide 41
TCP Release
•Follow the active party
CSE 461 University of Washington 41
5/2/2022 UW CSEP -561 41

## Slide 42
TCP Release (2)
•Follow the passive party
CSE 461 University of Washington 42
5/2/2022 UW CSEP -561 42

## Slide 43
TCP Release
•With states …
431
2
CLOSEDActive party Passive party
FIN_WAIT_1
CLOSE_WAIT
LAST_ACKFIN_WAIT_2
TIME_WAIT
CLOSEDESTABLISHED
(timeout)ESTABLISHED
5/2/2022 UW CSEP -561 43

## Slide 44
TIME_WAIT State
•Wait a long time after sending all segments and before 
completing the close
•Two times the maximum segment lifetime of 60 seconds
•Why?
•ACK might have been lost, in which case FIN will be resent for an 
orderly close
•Could otherwise interfere with a subsequent connection
5/2/2022 UW CSEP -561 44

## Slide 45
Chaotic optimization in the real world …
•The TCP close procedure we just described is “clean”, but…
•Also requires more messages
•Means the connection state needs to be maintained by the server during 
the close…
•What if your server is serving 10k, 100k, 1m clients???
•What if the data transferred is small and you know at the application layer that 
the client received it all…
•TCP also has an unorganized close … the “reset”
•Intended for use if the connection becomes corrupted
•Can be sent by either party, no guarantee all data transmitted or received
•Handled as an error/exception, but often sent by real -world endpoints 
instead of a full close!
5/2/2022 UW CSEP -561 45

## Slide 46
Bytestream Rate Control
5/2/2022 UW CSEP -561 46

## Slide 47
Recall Stop -and-Wait
•It allows only a single message to be outstanding 
from the sender:
•Fine for LAN (only one frame fits in network anyhow)
•Not efficient for network paths with BD >> 1 packet
47
5/2/2022 UW CSEP -561 47

## Slide 48
Sliding Window
•Generalization of stop -and-wait
•Allows W packets to be outstanding
•Can send W packets per RTT (= 2D)
•Pipelining improves performance 
•Need W= 2BD to fill network path
48
5/2/2022 UW CSEP -561 48

## Slide 49
Sliding Window Protocol
•Many variations, depending on how buffers, 
acknowledgements, and retransmissions are handled
•Go-Back -N
•Simplest version, can be inefficient
•Selective Repeat
•More complex, better performance
49
5/2/2022 UW CSEP -561 49

## Slide 50
Sliding Window –Sender 
•Sender buffers up to W segments until they are 
acknowledged
•LFS= LAST FRAME SENT, LAR= LAST ACK REC’D
•Sends while LFS –LAR <W 
50567.
.234523.
.
LAR LFSW=5
Acked Unacked 3 UnavailableAvailable
seq. numberSliding
Window
5/2/2022 UW CSEP -561 50

## Slide 51
Sliding Window –Sender (2) 
•Transport accepts another segment of data from the 
Application ...
•Transport sends it (as LFS –LAR < 5)
51567.
.234523.
.
LARW=5
Acked Unacked 3 UnavailableSent
seq. numberSliding
Window
LFS
5/2/2022 UW CSEP -561 51

## Slide 52
Sliding Window –Sender (3) 
•Next higher ACK arrives from peer…
•Window advances, buffer is freed 
•LFS–LAR < 5 (can send one more) 
52567.
.234523.
.
LARW=5
Acked Unacked 3 UnavailableAvailable
seq. numberSliding
Window
LFS
5/2/2022 UW CSEP -561 52

## Slide 53
Sliding Window –Go-Back -N
•Receiver keeps only a single packet buffer for the 
next segment
•State variable, LAS = LAST ACK SENT
•On receive:
•If seq. number is LAS+1, accept and pass it to app, update 
LAS, send ACK
•Otherwise discard (as out of order)
53
5/2/2022 UW CSEP -561 53

## Slide 54
Sliding Window –Selective Repeat
•Receiver passes data to app in order, and buffers out -of-
order segments to reduce retransmissions
•ACK conveys highest in -order segment
•Plus hints about out -of-order segments in modern 
implementations
•TCP uses a selective repeat design
54
5/2/2022 UW CSEP -561 54

## Slide 55
Sliding Window –Retransmissions
•Go-Back -N uses a single timer to detect losses
•On timeout, resends buffered packets  starting at LAR+1
•Simple low -resource receiver implementation
•Selective Repeat uses a timer per unacked segment 
to detect losses
•On timeout for segment, resend it
•Hope to resend fewer segments
55
5/2/2022 UW CSEP -561 55

## Slide 56
Sequence Numbers
•Need more than 0/1 for Stop -and-Wait …
•But how many?
•For Selective Repeat, need W numbers for packets, plus W 
for acks of earlier packets
•2W seq. numbers
•Fewer for Go -Back -N (W+1)
•Typically implement seq. number with an N -bit counter that 
wraps around at 2N—1 
•E.g., N=8:   …, 253, 254, 255, 0, 1, 2, 3, …
5/2/2022 UW CSEP -561 56

## Slide 57
Sequence vs. Time Plot
5/2/2022 UW CSEP -561 57TimeSeq. NumberAcks transmitted
(at Receiver)
Delay (=RTT/2)Transmissions
(at Sender)

## Slide 58
Sequence vs. Time Plot: Go -Back -N
5/2/2022 UW CSEP -561 58TimeSeq. NumberSingle 
Segment 
Loss
TimeoutRetransmissionsWindow full, stop TxTimeout expires…
Go back and retransmit!

## Slide 59
Sequence vs. Time Plot: Selective Retransmit
5/2/2022 UW CSEP -561 59TimeSeq. NumberSingle 
segment 
Loss
TimeoutRetransmissionWindow full, stop TxTimeout expires…
Go back and retransmit!
With selective ack
(modern TCP), immediately continue

## Slide 60
A Related Problem…
•Sliding window keeps the network busy
•What if the receiver application is overloaded?
5/2/2022 UW CSEP -561 60Arg 🥵…
Streaming video
Big IronConstrained
Mobile

## Slide 61
Flow Control
•TCP-style example
•seq/ack sliding window
•Flow control with WIN
•seq + length < ack + win 
•4KB buffer at receiver
•Implemented as a circular 
buffer of bytes
5/2/2022 UW CSEP -561 61

## Slide 62
TCP Uses Sliding Window + Flow Control
•Sliding window controls how many segments are inside the 
network
•Flow control avoids overflowing receiver buffers
•TCP only sends small bursts of segments to let the network 
keep the traffic smooth
•Many implementation details
•Ack clocking, window sizing, etc.
•(see “Silly Window Syndrome” in textbook reading for today)
•“Nagle’s Algorithm” has implications for high -performance 
work, be aware it exists, ask me in office hours if interested!
5/2/2022 UW CSEP -561 62

## Slide 63
Optimizing the Timeout
How do we actually know the value to use??? 🤨😵😩
5/2/2022 UW CSEP -561 63

## Slide 64
Real-world example of RTTs 
SEA->BCN ->SEA
5/2/2022 UW CSEP -561 6401002003004005006007008009001000
0 20 40 60 80 100 120 140 160 180 200Round Trip Time ( ms)
SecondsTimer too high!
Timer too low!Need to adapt to current 
network conditions!

## Slide 65
Simple Adaptive Timeout
•Smoothed estimates of the RTT (1) and variance in RTT (2)
•Update estimates with an exponentially weighted moving average
•SRTTN+1= 0.9*SRTTN+ 0.1*RTTN+1
•SvarN+1= 0.9* SvarN+ 0.1* |RTTN+1–SRTTN+1|
•Set timeout to a multiple of estimates
•To estimate the upper RTT in practice
•TCP TimeoutN= SRTTN+ 4* SvarN
5/2/2022 UW CSEP -561 65

## Slide 66
Example of Adaptive Timeout
5/2/2022 UW CSEP -561 6601002003004005006007008009001000
0 20 40 60 80 100 120 140 160 180 200RTT ( ms)
SRTT
Svar
Seconds

## Slide 67
Example of Adaptive Timeout ( 2)
5/2/2022 UW CSEP -561 6701002003004005006007008009001000
0 20 40 60 80 100 120 140 160 180 200RTT ( ms)Timeout (SRTT + 4* Svar )Early
timeout
Seconds

## Slide 68
Weighted -Average Adaptive Timeout 
Summary
•Simple to compute, does a good job of tracking actual RTT
•Little “headroom ” to lower
•Yet very few early timeouts
•Turns out to be important for good performance and 
robustness
5/2/2022 UW CSEP -561 68

## Slide 69
Congestion 🤧
🚐🚗🚙🚚🚗🚗
5/2/2022 UW CSEP -561 69

## Slide 70
Network Congestion
•A “traffic jam” in the network
5/2/2022 UW CSEP -561 70
What’s the hold up?
Network

## Slide 71
Congestion Collapse in the 1980 s
•Early TCP used fixed size window (e.g., 8 packets)
•Initially fine for reliability
•But something happened as the ARPANET grew
•Links stayed busy but transfer rates fell by orders of magnitude! 
5/2/2022 UW CSEP -561 71

## Slide 72
Nature of Congestion
•Routers/switches have internal buffering 
5/2/2022 UW CSEP -561 72
. . .
. . .
. . .
. . .
Input 
BufferOutput 
BufferFabricInput Output

## Slide 73
Nature of Congestion (2)
•Simplified view of per port output queues
•Typically FIFO (First In First Out), discard when full
5/2/2022 UW CSEP -561 73
Router
=
(FIFO) 
QueueQueued
PacketsRoute
r

## Slide 74
Nature of Congestion (3)
•Queues help by absorbing bursts when input > output rate
•But if input > output rate persistently, queue will overflow
•This is congestion
•Congestion is a function of the traffic patterns
•Can occur even if every link has the same capacity!
5/2/2022 UW CSEP -561 74

## Slide 75
Effects of Congestion
•What happens to performance as we increase load?
5/2/2022 UW CSEP -561 75

## Slide 76
Effects of Congestion (2)
•What happens to performance as we increase load?
5/2/2022 UW CSEP -561 76

## Slide 77
Effects of Congestion (3)
•As offered load rises, congestion occurs as queues 
begin to fill:
•Delay and loss rise sharply with more load
•Throughput falls below load (due to loss)
•Goodput may fall below throughput (due to spurious 
retransmissions)
•None of the above is good!
•Want network performance just before congestion
77
5/2/2022 UW CSEP -561 77

## Slide 78
Van Jacobson (1950 —) 
•Widely credited with saving the 
Internet from congestion collapse in 
the late 80s
•Introduced congestion control 
principles
•Practical solutions (TCP Tahoe/Reno) 
•Much other pioneering work:
•Tools like traceroute, tcpdump, 
pathchar
•IP header compression, multicast tools
78
5/2/2022 UW CSEP -561 78

## Slide 79
TCP Timeline
791990 1970 1980 1975 1985Origins of “TCP”
(Cerf & Kahn, ’74)3-way handshake
(Tomlinson, ‘75)TCP Reno
(Jacobson, ‘90)
Congestion collapse 
Observed, ‘86TCP/IP “flag day”
(BSD Unix 4.2, ‘83)
TCP Tahoe
(Jacobson, ’88)
Pre-history Congestion control. . .TCP and IP
(RFC 791/793, ‘81)
5/2/2022 UW CSEP -561 79

## Slide 80
TCP Timeline (2)
802010 2000 1995 2005ECN
(Floyd, ‘94)
TCP Reno
(Jacobson, ‘90) TCP New Reno
(Hoe, ‘95)TCP BIC
(Linux, ‘04TCP with SACK
(Floyd, ‘96)
Diversification Classic congestion control. . .1990TCP LEDBAT
(IETF ’08)
TCP Vegas
(Brakmo , ‘93)
TCP CUBIC
(Linux, ’06)
. . .Background Router support
Delay
based
FAST TCP
(Low et al., ’04)Compound TCP
(Windows, ’07)
5/2/2022 UW CSEP -561 80

## Slide 81
Bandwidth Allocation
•Important task for network is to allocate its capacity to 
senders
•Good allocation is both efficient and fair
•Efficient means most capacity is used but there is no 
congestion
•Fair means every sender gets a reasonable share the 
network
5/2/2022 UW CSEP -561 81

## Slide 82
Bandwidth Allocation (2)
•Key observation:
•In an effective solution, Transport and Network layers must work 
together
•Network layer witnesses congestion
•Only it can provide direct feedback
•Transport layer causes congestion
•Only it can reduce offered load
5/2/2022 UW CSEP -561 82

## Slide 83
Bandwidth Allocation (3)
•Why is it hard? (Just split equally!)
•Number of senders and their offered load changes
•Senders may lack capacity in different parts of network
•Network is distributed; no single party has an overall picture of its 
state
5/2/2022 UW CSEP -561 83

## Slide 84
Bandwidth Allocation (4)
•Solution context:
•Senders adapt concurrently based on their own view of the network
•Design this adaption so the network usage as a whole is efficient 
and fair
•Adaption is continuous since offered loads continue to change over 
time
5/2/2022 UW CSEP -561 84

## Slide 85
Fair Allocations
5/2/2022 UW CSEP -561 85

## Slide 86
Fair Allocation
•What ’s a “fair” bandwidth allocation?
•The max -min fair allocation is one that ’s often cited
•There are *huge* assumptions baked into this definition of 
fairness, which we ’ll talk about the last week!
86
5/2/2022 UW CSEP -561 86

## Slide 87
Recall
•We want a good bandwidth allocation to be both 
fair and efficient
•Now we learn what fair means
•Caveat: in practice, efficiency is more important 
than fairness
87
5/2/2022 UW CSEP -561 87

## Slide 88
Efficiency vs. Fairness
•Cannot always have both!
•Example network with traffic:
•A→B, B→C and A→ C 
•How much traffic can we carry?
88
A B C
1 1
5/2/2022 UW CSEP -561 88

## Slide 89
Efficiency vs. Fairness (2)
•If we care about fairness:
•Give equal bandwidth to each flow
•A→B: ½ unit, B→C: ½, and A→C, ½ 
•Total traffic carried is 1 ½ units
CSE 461 University of Washington 89
A B C
1 1
5/2/2022 89

## Slide 90
Efficiency vs. Fairness (3)
•If we care about efficiency:
•Maximize total traffic in network
•A→B: 1 unit, B→C: 1, and A→C, 0 
•Total traffic rises to 2 units!
90
A B C
1 1
5/2/2022 UW CSEP -561 90

## Slide 91
The Slippery Notion of Fairness
•Why is “equal per flow” fair anyway?
•A→C uses more network resources than A→B or B→C
•Host A sends two flows, B sends one
•Not productive to seek exact fairness
•More important to avoid starvation
•A node that cannot use any bandwidth
•“Equal per flow” is good enough
91
5/2/2022 UW CSEP -561 91

## Slide 92
Generalizing “Equal per Flow”
•Bottleneck for a flow of traffic is the link that limits 
its bandwidth
•Where congestion occurs for the flow
•For A→C, link A –B is the bottleneck 
92
A B C
1 10
Bottleneck
5/2/2022 UW CSEP -561 92

## Slide 93
Generalizing “Equal per Flow” (2)
•Flows may have different bottlenecks
•For A→C, link A –B is the bottleneck
•For B→C, link B –C is the bottleneck
•Can no longer divide links equally …
93
A B C
1 10
5/2/2022 UW CSEP -561 93

## Slide 94
Max-Min Fairness
•Intuitively, flows bottlenecked on a link get an equal share of 
that link
•Max -min fair allocation is one that:
•Increasing the rate of one flow will decrease the rate of a smaller 
flow
•This “maximizes the minimum” flow
5/2/2022 UW CSEP -561 94

## Slide 95
Max-Min Fairness 
•To find it given a network, imagine “pouring water into the 
network”
1.Start with all flows at rate 0
2.Increase the flows until there is a new bottleneck in the network
3.Hold fixed the rate of the flows that are bottlenecked
4.Go to step 2 for any remaining flows
5/2/2022 UW CSEP -561 95

## Slide 96
Max -Min Example
•Example: network with 4 flows, link bandwidth = 1
•What is the max -min fair allocation? 
96
5/2/2022 UW CSEP -561 96

## Slide 97
Max -Min Example (2)
•When rate=1/3, flows B, C, and D bottleneck R4 —R5 
•Fix B, C, and D, continue to increase A 
97Bottlenec
k
Bottleneck
5/2/2022 UW CSEP -561 97

## Slide 98
Max -Min Example (3)
•When rate=2/3, flow A bottlenecks R2 —R3. Done. 
98
Bottleneck
Bottlenec
k
5/2/2022 UW CSEP -561 98

## Slide 99
Max -Min Example (4)
•End with A=2/3, B, C, D=1/3, and R2/R3, R4/R5 full 
•Other links have extra capacity that can’t be used
•
99
5/2/2022 UW CSEP -561 99

## Slide 100
Adapting over Time
•Allocation changes as flows start and stop
100
Time 
5/2/2022 UW CSEP -561 100

## Slide 101
Adapting over Time (2)
101
Flow 1 slows when 
Flow 2 startsFlow 1 speeds up 
when Flow 2 stops
Time Flow 3 limit 
is elsewhere
5/2/2022 UW CSEP -561 101

## Slide 102
Implemeting
Bandwidth Allocation
5/2/2022 UW CSEP -561 102

## Slide 103
Additive Increase Multiplicative Decrease 
•AIMD is a control law hosts can use to reach a good 
allocation
•Hosts additively increase rate while network not congested
•Hosts multiplicatively decrease rate when congested
•Used by TCP
•Let’s explore the AIMD game …
5/2/2022 UW CSEP -561 103

## Slide 104
AIMD Game
•Hosts 1 and 2 share a bottleneck
•But do not talk to each other directly
•Router provides binary feedback
•Tells hosts if network is congested
5/2/2022 UW CSEP -561 104
Rest of
NetworkBottleneck
RouterHost 1
Host 21
11

## Slide 105
AIMD Game (2)
•Each point is a possible allocation
5/2/2022 UW CSEP -561 105Host 1
Host 20 11
Fair
EfficientOptimal
AllocationCongested

## Slide 106
AIMD Game (3)
•AI and MD move the allocation 
5/2/2022 UW CSEP -561 106Host 1
Host 
20 11
Fair, y=x
Efficient, x+y=1Optimal
AllocationCongested
Multiplicative
DecreaseAdditive
Increase

## Slide 107
AIMD Game (4)
•Play the game!
5/2/2022 UW CSEP -561 107Host 1
Host 
20 11
Fair
EfficientCongested
A starting 
point

## Slide 108
AIMD Game (5)
•Always converge to good allocation!
5/2/2022 UW CSEP -561 108Host 1
Host 20 11
Fair
EfficientCongested
A starting 
point

## Slide 109
AIMD Sawtooth
•Produces a “sawtooth ” pattern  over time for rate of each 
host
•This is the “TCP sawtooth ”
5/2/2022 UW CSEP -561 109Multiplicative
DecreaseAdditive
Increase
TimeHost 1 or 
2’s Rate

## Slide 110
AIMD Properties
•Converges to an allocation that is efficient and fair when 
hosts run it
•Holds for more general topologies
•Other increase/decrease control laws do not!
•(Try MIAD, MIMD, MIAD)
•Requires only binary feedback from the network
5/2/2022 UW CSEP -561 110

## Slide 111
Feedback Signals
•Several possible signals, with different pros/cons
5/2/2022 UW CSEP -561 111Activity:
1.In a group of 3, come up with two 
different possible feedback signals
2.And what are their pros/cons

## Slide 112
Feedback Signals
•Several possible signals, with different pros/cons
5/2/2022 UW CSEP -561 112Signal Example Protocol Pros / Cons
Packet loss TCP NewReno
Cubic TCP (Linux)Hard to get wrong
Hear about congestion late
Packet delay TCP BBR (Youtube) Hear about congestion early
Need to infer congestion
Router 
indicationTCPs with Explicit 
Congestion Notification
DCTCP (Datacenters)Hear about congestion early
Require router support

## Slide 113
Feedback Signals
•Several possible signals, with different pros/cons
•Classic TCP uses packet loss as a signal
5/2/2022 UW CSEP -561 113Signal Example Protocol Pros / Cons
Packet loss TCP NewReno
Cubic TCP (Linux)Hard to get wrong
Hear about congestion late
Packet delay TCP BBR (Youtube) Hear about congestion early
Need to infer congestion
Router 
indicationTCPs with Explicit 
Congestion Notification
DCTCP (Datacenters)Hear about congestion early
Require router support

## Slide 114
Practical AIMD
•We want TCP to follow an AIMD control law for a 
good allocation
•Sender uses a congestion window or cwnd to set its 
rate (≈cwnd/RTT)
•Sender uses loss as network congestion signal
•Need TCP to work across a very large range of rates 
and RTTs
114
5/2/2022 UW CSEP -561 114

## Slide 115
TCP Startup Practical Problem
•We want to quickly near the right rate, cwndIDEAL, but 
it varies greatly
•Fixed initial window too large is rough on the network 
(loss !)
•Additive Increase adapts cwnd gently to the network, but 
might take a long time to become efficient
115
5/2/2022 UW CSEP -561 115

## Slide 116
Slow -Start Solution
•Start by doubling cwnd every RTT
•Exponential growth (1, 2, 4, 8, 16, …)
•Start slow, but quickly reach large values
116
AIFixed
TimeWindow ( cwnd )
Slow -start
5/2/2022 UW CSEP -561 116

## Slide 117
Slow -Start Solution (2)
•Eventually packet loss will occur when the network 
is congested
•Loss timeout tells us cwnd is too large
•Next time, switch to AI beforehand
•Slowly adapt cwnd near right value
•In terms of cwnd:
•Expect loss for cwndC≈ 2BD+queue
•Use ssthresh = cwndC/2 to switch to AI
117
5/2/2022 UW CSEP -561 117

## Slide 118
Slow -Start Solution (3)
•Combined behavior, after first time
•Most time spend near right value
118
AIFixed
TimeWindow
ssthreshcwndC
cwndIDEALAI phase
Slow -start
5/2/2022 UW CSEP -561 118

## Slide 119
A Practial Enhancement: Infer Loss from ACKs
•TCP uses a cumulative ACK
•Carries highest in -order seq. number
•Normally a steady advance
•Duplicate ACKs give us hints about what data hasn’t 
arrived
•Tell us some new data did arrive, but it was not next 
segment
•Thus the next segment may be lost
119
5/2/2022 UW CSEP -561 119

## Slide 120
The Fast Retransmit Heuristic
•Treat three duplicate ACKs as a loss 
•Retransmit next expected segment
•Some repetition allows for reordering, but still detects loss 
quickly
120
Ack 1  2  3  4  5  5  5  5  5  5
5/2/2022 UW CSEP -561 120

## Slide 121
Fast Retransmit (2)
121Ack 10
Ack 11
Ack 12
Ack 13
. . . Ack 13
Ack 13Ack 13
Data 14. . . Ack 13
Ack 20
. . . . . . Data 20
Third duplicate 
ACK, so send 14 Retransmission fills 
in the hole at 14ACK jumps after 
loss is repaired. . . . . . 
Data 14 was lost 
earlier, but got 
15 to 20
5/2/2022 UW CSEP -561 121

## Slide 122
Inferring Non -Loss from ACKs
•Duplicate ACKs also give us hints about what data 
has arrived
•Each new duplicate ACK means that some new segment 
has arrived
•It will be the segments after the loss
•Thus advancing the sliding window will not increase the 
number of segments outstanding in the network
122
5/2/2022 UW CSEP -561 122

## Slide 123
Fast Recovery
•First fast retransmit
•(and decrease cwnd in response to loss)
•Then pretend further duplicate ACKs were the 
expected ACKs
•Lets new segments be sent for ACKs 
•Reconcile views when the ACK jumps
123
Ack 1  2  3  4  5  5  5  5  5  5
5/2/2022 UW CSEP -561 123

## Slide 124
Fast Recovery (2)
124Ack 12
Ack 13
Ack 13
Ack 13Ack 13
Data 14Ack 13
Ack 20
. . . . . . Data 20Third duplicate 
ACK, so send 14Data 14 was lost 
earlier, but got 
15 to 20
Retransmission fills 
in the hole at 14Set ssthresh, 
cwnd =  cwnd/2 
Data 21
Data 22More ACKs advance 
window; may send 
segments before jumpAck 13
Exit Fast Recovery
5/2/2022 UW CSEP -561 124

## Slide 125
Fast Recovery (3)
•With fast retransmit, it repairs a single segment loss quickly
•No timeouts in normal case
•Continue with a smaller cwnd quickly
•This allows us to realize practical AIMD!
•TCP Reno combines slow -start, fast retransmit and fast 
recovery
5/2/2022 UW CSEP -561 125

## Slide 126
Sequence vs. Time Plot: Fast Recovery
5/2/2022 UW CSEP -561 126TimeSeq. NumberSingle 
segment 
Loss Retransmission 
after duplicate 
or selective ackOnly a small interruption to regular 
flow of data

## Slide 127
TCP Reno
5/2/2022 UW CSEP -561 127
MD of ½ , no slow -startTCP sawtooth

## Slide 128
TCP Reno, NewReno , and SACK
•Reno can repair one loss per RTT
•Multiple losses cause a timeout
•NewReno further refines ACK heuristics
•Repairs multiple losses without timeout
•Selective ACK (SACK) is an even better idea
•Receiver sends ACK ranges so sender can retransmit without 
guesswork
•Requires a header extension , but widely used in practice today!
5/2/2022 UW CSEP -561 128

## Slide 129
TCP CUBIC
•Current standard TCP Stack
•Linux (>= 2.6.19)
•Windows (>= 10.1709)
•MacOS (>= Yosemite)
•Internet grows to have more long -distance, high bandwidth 
connections
•Seeks to resolve two key problems with “standard” TCP:
•Flows with lower RTT’s “grow” faster than those with higher RTTs
•Flows grow too “slowly” (linearly) after congestion
5/2/2022 UW CSEP -561 129

## Slide 130
TCP CUBIC
1.At the time of experiencing congestion event the window size for 
that instant will be recorded as Wmaxor the maximum window size.
2.The Wmaxvalue will be set as the inflection point of the cubic function 
that will govern the growth of the congestion window.
3.The transmission will then be restarted with a smaller window value 
(20%) and, if no congestion is experienced, this value will increase 
according to the concave portion of the cubic function ( not 
depending on received ACKs for cadence ).
4.As the window approaches Wmaxthe increments will slow down.
5.Once the tipping point has been reached, i.e.Wmax, the value of the 
window will continue to increase discreetly.
6.Finally, if the network is still not experiencing any congestion, the 
window size will continue to increase according to the convex portion 
of the function.
5/2/2022 UW CSEP -561 130

## Slide 131
TCP CUBIC
5/2/2022 UW CSEP -561 131
Still keeps all the same tricks from NewReno about fast 
recovery and fast retransmit w/ SACK,
Replaces additive increase with a cubic function
Why is this helpful?

## Slide 132
TCP CUBIC vs Everyone
5/2/2022 UW CSEP -561 132

## Slide 133
The next generation? TCP BBR
•Bottleneck Bandwidth and Round -trip propagation time 
•Developed at Google in 2016 primarily for YouTube traffic
•Attempting to solve “ bufflerbloat ” problem
•“Model -based” (Vegas) rather than “Loss -based” (CUBIC)
•Measure RTT, latency, bottleneck bandwidth
•Use this to predict window size
5/2/2022 UW CSEP -561 133

## Slide 134
Bufferbloat
•Larger queues are better than smaller queues right?
5/2/2022 UW CSEP -561 134When might this not be the case?

## Slide 135
Bufferbloat
•Given TCP loss semantics…
•Performance can decrease as 
buffer size is increased
•Consider a mostly full buffer:
•New packets arrive and have to 
wait
•Then are transmitted to next 
mostly full buffer
•No drops but performance (in 
terms of latency!) degrades
5/2/2022 UW CSEP -561 135

## Slide 136
TCP BBR
BBR Has 4 Distinct Phases:
1.Startup: Basically identical to Cubic. Exponentially grow 
until RTTs start to increase (instead of dropped packet). Set 
cwnd . 
2.Drain: Startup filled a queue.  Temporarily reduce sending 
rate (known as “pacing gain”)
3.Probe Bandwidth: Increase sending rate to see if there’s 
more capacity. If not, drain again.
4.Probe RTT: Reduce rate dramatically (4 packets) to measure 
RTT. Use this as our baseline for above. 
5/2/2022 UW CSEP -561 136

## Slide 137
TCP BBR vs Everyone
5/2/2022 UW CSEP -561 137

## Slide 138
Network -Side Congestion 
Control
5/2/2022 UW CSEP -561 138

## Slide 139
Congestion Avoidance vs. Control
•Classic TCP drives the network into congestion and then 
recovers
•Needs to see loss to slow down
•Would be better to use the network but avoid congestion 
altogether!
•Reduces loss and delay
•But how can we do this?
5/2/2022 UW CSEP -561 139

## Slide 140
Feedback Signals
Delay and router signals can let us avoid congestion
5/2/2022 UW CSEP -561 140Signal Example Protocol Pros / Cons
Packet loss Classic TCP
Cubic TCP (Linux)Hard to get wrong 👍
Hear about congestion late 🤕
Packet delay TCP BBR (Youtube) Hear about congestion early 🙌
Need to infer congestion 😥
Router 
indicationTCPs with Explicit 
Congestion NotificationHear about congestion early 🙌
Require router support 😔

## Slide 141
ECN (Explicit Congestion Notification)
•Router detects the onset of congestion via its queue
•When congested, it marks affected packets (IP header)
5/2/2022 UW CSEP -561 141

## Slide 142
ECN (2)
•Marked packets arrive at receiver; treated as loss
•TCP receiver reliably informs TCP sender of the congestion
5/2/2022 UW CSEP -561 142

## Slide 143
ECN (3)
•Advantages:
•Routers deliver clear signal to hosts
•Congestion is detected early, (no loss 🎉🤩💯)
•No extra packets need to be sent
•Disadvantages:
•Routers and hosts must be upgraded
•More work at router
•With IPv4 even have to recompute that pesky checksum : (
5/2/2022 UW CSEP -561 143In hindsight, ECN is a much better approach than using loss…
Loss -based signaling causes active harm to the flow in the 
process of notifying about congestion : (

## Slide 144
Random Early Detection (RED)
•Jacobson (again!) and Floyd
•Alternative idea: instead of marking packets, drop
•We know they’re using TCP , make use of that fact
•Signals congestion to sender
•But without adding headers or doing packet inspection
•Drop at random, depending on queue size
•If queue empty, accept packet always
•If queue full, always drop
•As queue approaches full, increase likelihood of packet drop
•Example: 1 queue slot left, 10 packets expected, 90% chance of drop
5/2/2022 UW CSEP -561 144An iterim solution, better than 
nothing until ECN is widespread

## Slide 145
RED (Random Early Detection)
•Router detects the onset of congestion via its queue
•Prior to congestion, drop a packet to signal
•Lightweight: no per -flow state, no header modification
5/2/2022 UW CSEP -561 145
Drop packet

## Slide 146
RED (Random Early Detection)
•Sender enters MD (multiplicative decrease), slows packet flow
•We shed load, everyone is happy 
5/2/2022 UW CSEP -561 146
Drop packet

## Slide 147
Final thoughts on congestion control
•End-host approaches by their nature are cooperative, and can 
be abused by malicious hosts
•What would you do if you were an internet service provider?
5/2/2022 UW CSEP -561 147In practice drives lots of complexity in real -world access networks!
In cellular the network sets per -user rate limits + sharing priorities
Fiber + Cable networks add user ratelimiting too, inline hardware to detect and 
police “nonresponsive” flows that don’t cooperate

