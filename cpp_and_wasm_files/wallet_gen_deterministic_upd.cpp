/*
Input Format (can support as large as 6):
n
(p_safe, p_leak, p_lost, p_stolen)_1
(p_safe, p_leak, p_lost, p_stolen)_2
...
(p_safe, p_leak, p_lost, p_stolen)_n

Optmized Version: add multi-threading (2s for 6 keys on PC)
*/

#include <stdio.h>
#define ull unsigned long long

double p[7][5],pa[65],pb[65];
double prb[65][65];
ull st_set[8000005],pattern;
bool acc[65];

double maxn=-1.0;
int n,num;

double glb_maxn=-1;
ull glb_pat=0;

void enumerate(int cur,ull sta){
	if (cur==(1<<n)){
		st_set[++num]=sta;
		return;
	}
	int tag=0;
	for (int i=0;i<n;i++){
		if ((cur&(1<<i))&&(sta&(1ull<<(cur^(1<<i))))){
			tag=1;
			break;
		}
	}
	sta|=(1ull<<cur);
	enumerate(cur+1,sta);
	if (!tag){
		sta^=(1ull<<cur);
		enumerate(cur+1,sta);
	}
}


inline void check(int pos){
	
	int ed=num+1;
	int ac[65],rj[65];
	
	double maxn=-1.0;
	ull pattern=0;
	
	for (int i=pos;i<ed;i++){
		int n1=0,n2=0;
		for (int j=0;j<(1<<n);j++){
			if (st_set[i]&(1ull<<j)){
				ac[++n1]=j;
			}
			else{
				rj[++n2]=j;
			}
		}
		double ans=0.0;
		for (int j=1;j<=n1;j++){
			for (int k=1;k<=n2;k++){
				ans+=prb[ac[j]][rj[k]];
			}
		}
		if (ans>maxn){
			maxn=ans;
			pattern=st_set[i];
		}
	}
	
	//mtx.lock();
	
	glb_maxn=maxn;
	glb_pat=pattern;
	
	//mtx.unlock();
	
	return;
	
}

inline void op_pattern(ull pattern){
	printf ("return ");
	int cnt=0;
	if (pattern&1ull){
		puts("true;");
		return;
	}
	
	for (int i=0;i<(1<<n);i++){
		if (!(pattern&(1ull<<i))){
			continue;
		}
		acc[i]=1;
		int tag=0;
		for (int j=i&(i-1);j;j=(j-1)&i){
			if (acc[j]){
				tag=1;
				break;
			}
		}
		if (tag){
			continue;
		}
		if (cnt) printf (" || ");
		cnt++;
		printf ("(");
		int cot=0;
		for (int j=0;j<n;j++){
			if (i&(1<<j)){
				if (cot){
					printf (" && ");
				}
				cot++;
				printf ("k[%d]",j+1);
			}
		}
		printf (")");
	}
	puts(";");
}
	

int main (){
	
	scanf ("%d",&n);
	
	
	for (int i=0;i<n;i++){
		for (int j=0;j<4;j++){
			int x;
			scanf ("%d",&x);
			p[i][j]=0.01*x;
		}
	}
	
	for (int i=0;i<(1<<(2*n));i++){
		int na=0,nb=0;
		double prob=1.0;
		for (int j=0;j<2*n;j+=2){
			int sta=0;
			if (i&(1<<j)){
				sta|=1;
			}
			if (i&(1<<(j+1))){
				sta|=2;
			}
			if (sta==0||sta==1){
				na|=(1<<(j>>1));
			}
			if (sta==1||sta==3){
				nb|=(1<<(j>>1));
			}
			prob*=p[(j>>1)][sta];
		}
		prb[na][nb]+=prob;
	}
	
	enumerate(0,0);
	//printf ("Total Number of Boolean Formula: %d\n",num);
	/*
	for (int i=1;i<=num;i++){
		int n1=0,n2=0;
		for (int j=0;j<(1<<n);j++){
			if (st_set[i]&(1ull<<j)){
				ac[++n1]=j;
			}
			else{
				rj[++n2]=j;
			}
		}
		double ans=0.0;
		for (int j=1;j<=n1;j++){
			for (int k=1;k<=n2;k++){
				ans+=prb[ac[j]][rj[k]];
			}
		}
		if (ans>maxn){
			maxn=ans;
			pattern=st_set[i];
		}
	}
	*/
	/*
	if (n!=6){
		check(1);
	}
	else{
		std::vector<std::thread> threads;
  		for (int i=0;i<16;i++) {
    		threads.push_back(std::thread(check, i*500000+1));
  		}
  		for (auto &th : threads) {
    		th.join();
  		}
  	}
  	*/
	 check(1);
  	
  		
		
		
	
	//printf ("Best Probability: %.6lf\n",maxn);
	printf ("Successful Rate: %.6lf\n",glb_maxn);
	op_pattern(glb_pat);
	
	/*
	printf ("Best Boolean Pattern:\n");
	
	for (int i=0;i<(1<<n);i++){
		for (int j=0;j<n;j++){
			if (i&(1<<j)){
				putchar('1');
			}
			else{
				putchar('0');
			}
		}
		putchar(':');
		putchar(' ');
		if (pattern&(1ull<<i)){
			puts("Accept");
		}
		else{
			puts("Reject");
		}
	}
	*/
	
}

/*
6
90 10 0 0
50 30 20 0
40 40 10 10
80 0 0 20
70 15 5 10
70 5 10 15

5
90 10 0 0
50 30 20 0
40 40 10 10
80 0 0 20
70 15 5 10

emcc wallet_gen_deterministic.cpp -o wallet_gen_deterministic.wasm -s TOTAL_MEMORY=134217728 -O3 --std=c++11
*/
	
	

